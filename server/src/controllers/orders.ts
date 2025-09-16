import { createObjectCsvStringifier } from 'csv-writer';
import { TIK_TOK_CONFIG } from '../config';
import { createOrder, getOrderByTag } from '../lib/shopify/utils';
import type { TikTokOrder } from '../lib/types/tiktok';
import {
  parseCSV,
  getCountryCode,
  getStateCode,
  getTaxRate,
  createOrderLineItems,
  createShippingLines,
} from '../lib/utils';
import type { LineItem, Order, ShippingLine } from '../lib/types/order';

const {
  sourceName,
  currency,
  disableAmounts = false,
  shippingMethodTitle,
} = TIK_TOK_CONFIG;

function getTikTokSkuIds(lineItems: LineItem[]) {
  const object: Record<string, { skuId: string; quantity: number }> = {};
  lineItems.forEach((item) => {
    object[item.sku] = {
      skuId: item.ttSkuId.trim(),
      quantity: item.quantity,
    };
  });
  return JSON.stringify(object);
}

function validateHeaders(headers: string[]) {
  const requiredHeaders = [
    'Order ID',
    'Buyer Username',
    'Recipient',
    'Address Line 1',
    'City',
    'State',
    'Zipcode',
    'Country',
    'Phone #',
    'Product Name',
    'Seller SKU',
    'SKU ID',
    'Quantity',
    'SKU Unit Original Price',
    'SKU Subtotal Before Discount',
    'SKU Subtotal After Discount',
    'Retail Delivery Fee',
    'Original Shipping Fee',
    'Shipping Fee After Discount',
    'Taxes',
  ];
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    console.log('CSV headers validation failed');
    const error = `Missing required headers: ${missingHeaders.join(', ')}`;
    throw new Error(error);
  }
}

async function createOrders(file: string) {
  console.log('TikTok Order Importer');
  console.log('=====================');
  // console.log('Processing file:', filePath);

  const rows = await parseCSV<TikTokOrder>(file);
  // check for the correct headers
  validateHeaders(Object.keys(rows[0]));
  console.log('CSV headers validated');
  console.log('================================');

  console.log('There are ', rows.length, 'rows in the CSV file');

  const orders: Record<string, Order> = {};
  rows.forEach((row) => {
    const orderId = row['Order ID'].trim();
    const buyerEmail = row['Buyer Username'] + '@scs.tiktokw.us';
    const fullName = row['Recipient'].split(' ');

    if (!orders[orderId]) {
      orders[orderId] = {
        customer: {
          email: buyerEmail,
          firstName: fullName[0],
          lastName: fullName[1],
          phone: '',
        },
        shippingAddress: {
          address1: row['Address Line 1'],
          address2: row['Address Line 2'],
          city: row['City'],
          provinceCode: getStateCode(row['State']),
          zip: row['Zipcode'],
          countryCode: getCountryCode(row['Country']),
          firstName: fullName[0] || 'TikTok',
          lastName: fullName[1] || 'Customer',
          phone: row['Phone #'],
        },
        lineItems: [
          {
            title: row['Product Name'],
            sku: row['Seller SKU'],
            quantity: parseInt(row['Quantity'], 10),
            originalPrice: parseFloat(row['SKU Unit Original Price']),
            priceBeforeDiscount:
              parseFloat(row['SKU Subtotal Before Discount']) /
              parseInt(row['Quantity'], 10),
            priceAfterDiscount:
              parseFloat(row['SKU Subtotal After Discount']) /
              parseInt(row['Quantity'], 10),
            ttSkuId: row['SKU ID'],
            retailDeliveryFee: parseFloat(row['Retail Delivery Fee']),
          },
        ],
        shippingLines: [
          {
            title: shippingMethodTitle,
            originalShippingFee: parseFloat(row['Original Shipping Fee']),
            shippingFeeAfterDiscount: parseFloat(
              row['Shipping Fee After Discount'],
            ),
          },
        ],
        taxes: parseFloat(row['Taxes']),
        packageID: row['Package ID'] || '',
      };
    } else {
      orders[orderId].lineItems.push({
        title: row['Product Name'],
        sku: row['Seller SKU'],
        quantity: parseInt(row['Quantity'], 10),
        originalPrice: parseFloat(row['SKU Unit Original Price']),
        priceBeforeDiscount:
          parseFloat(row['SKU Subtotal Before Discount']) /
          parseInt(row['Quantity'], 10),
        priceAfterDiscount:
          parseFloat(row['SKU Subtotal After Discount']) /
          parseInt(row['Quantity'], 10),
        ttSkuId: row['SKU ID'],
        retailDeliveryFee: parseFloat(row['Retail Delivery Fee']),
      });
    }
  });

  const orderIds = Object.keys(orders);
  console.log('There are ', orderIds.length, 'unique orders in the CSV file');
  console.log('=====================');
  console.log('Generating Order Inputs for Shopify...');

  const csvRecords: any[] = [];

  for (const orderId of orderIds) {
    try {
      const order = orders[orderId];

      const existingOrder = await getOrderByTag(`\"TikTokOrderID:${orderId}\"`);

      if (existingOrder) {
        console.log(
          `Order with TikTokOrderID:${orderId} already exists in Shopify with ID ${existingOrder.id}, skipping...`,
        );
        csvRecords.push({
          orderId,
          shopifyOrderId: existingOrder.id,
          status: 'Skipped',
          message: 'Order already exists in Shopify',
          skuIds: getTikTokSkuIds(order.lineItems),
        });
        continue;
      }

      const { customer, shippingAddress, lineItems, shippingLines } = order;

      const lineItemsTotal = lineItems.reduce(
        (total, item) => total + item.priceAfterDiscount * item.quantity,
        0,
      );

      const retailDeliveryFee = lineItems.reduce(
        (total, item) => total + item.retailDeliveryFee,
        0,
      );

      const shippingLinesTotal = shippingLines.reduce(
        (total, item) => total + item.shippingFeeAfterDiscount,
        0,
      );

      const taxesTotal = order.taxes || 0;

      const taxRate = getTaxRate(
        lineItemsTotal,
        shippingLinesTotal,
        taxesTotal,
      );

      const lineItemsWithVariants = await createOrderLineItems(
        lineItems,
        taxRate,
        currency,
        disableAmounts,
      );

      if (retailDeliveryFee > 0) {
        lineItemsWithVariants.push({
          // @ts-expect-error - this is a custom line item
          title: 'Retail Delivery Fee',
          quantity: 1,
          priceSet: {
            shopMoney: {
              amount: parseFloat(retailDeliveryFee.toFixed(2)),
              currencyCode: currency,
            },
          },
        });
      }

      const shippingLinesWithTax = createShippingLines(
        shippingLines,
        taxRate,
        currency,
        disableAmounts,
      );

      const customerToUpsert = { ...customer };
      if (!customerToUpsert.phone?.trim()) delete customerToUpsert.phone;

      const orderTotal =
        lineItemsTotal + shippingLinesTotal + retailDeliveryFee + taxesTotal;

      const orderInput = {
        order: {
          sourceName,
          currency: currency || 'USD',
          lineItems: lineItemsWithVariants,
          shippingAddress,
          tags: ['Shipped by Seller', `TikTokOrderID:${orderId}`],
          customer: { toUpsert: customerToUpsert },
          financialStatus: 'PAID',
          note: `TikTok Order ID: ${orderId}`,
          customAttributes: [
            { key: 'TikTokOrderID', value: orderId },
            { key: 'PackageID', value: order.packageID },
          ],
          shippingLines: shippingLinesWithTax,
          transactions:
            disableAmounts || orderTotal === 0
              ? []
              : [
                  {
                    kind: 'SALE',
                    status: 'SUCCESS',
                    amountSet: {
                      shopMoney: {
                        amount: orderTotal,
                        currencyCode: currency || 'USD',
                      },
                    },
                  },
                ],
        },
      };

      console.log('Generated input for order ', orderId);

      console.log('Creating order for TikTok Order:', orderId);

      const response = await createOrder(orderInput);

      if (
        response.error ||
        !response.data?.orderCreate?.order ||
        response.data.orderCreate.userErrors.length
      ) {
        const msg =
          response.error?.message ||
          response.data.orderCreate?.userErrors[0]?.message ||
          'Unknown error';
        csvRecords.push({
          orderId,
          shopifyOrderId: '',
          status: 'Failed',
          message: msg,
          skuIds: getTikTokSkuIds(order.lineItems),
        });
        console.error('Error creating order:', orderId, msg);
      } else {
        csvRecords.push({
          orderId,
          shopifyOrderId: response.data.orderCreate.order.id,
          status: 'Success',
          message: 'Order created successfully',
          skuIds: getTikTokSkuIds(order.lineItems),
        });
        console.log(
          'Order created successfully:',
          response.data.orderCreate.order.id,
          'for TikTok Order:',
          orderId,
        );
      }
    } catch (err: any) {
      csvRecords.push({
        orderId,
        shopifyOrderId: '',
        status: 'Failed',
        message: err.message,
        skuIds: getTikTokSkuIds(orders[orderId].lineItems),
      });
      console.log('Error creating order:', orderId, err.message);
    }
  }

  return csvRecords;
}

// Express controller
export const createOrdersController = async (req: any, res: any) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'file is required' });
    }

    const csvString = req.file.buffer.toString('utf8');

    const csvRecords = await createOrders(csvString);

    console.log('=====================');
    console.log('All orders processed. Output written to CSV Download:');

    // Create CSV string in memory
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'orderId', title: 'Order ID' },
        { id: 'shopifyOrderId', title: 'Shopify Order ID' },
        { id: 'status', title: 'Status' },
        { id: 'message', title: 'Message' },
        { id: 'skuIds', title: 'SKU IDs' },
      ],
    });

    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(csvRecords);
    const csvContent = headerString + recordsString;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=processed.csv`);
    res.send(csvContent);
  } catch (err: any) {
    console.log('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
