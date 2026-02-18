import type { Request, Response } from 'express';
import { createObjectCsvStringifier } from 'csv-writer';

import { TIK_TOK_CONFIG } from '../config';
import { getOrderByTag } from '../lib/shopify/utils';
import type { TikTokOrder } from '../lib/types/tiktok';
import { parseCSV, getCountryCode, getStateCode } from '../lib/utils';
import type { LineItem, Order } from '../lib/types/order';
import { nsAuthenticatedFetch } from '../lib/netsuite/utils';
import type { NetSuiteResponse } from '../lib/netsuite/types';

const { shippingMethodTitle } = TIK_TOK_CONFIG;

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

function getTikTokSkuIds(lineItems: LineItem[]) {
  // create object
  const object: Record<string, { skuId: string; quantity: number }> = {};
  lineItems.forEach((item) => {
    // object[item.ttSkuId.trim()] = item.quantity;
    object[item.sku] = {
      skuId: item.ttSkuId.trim(),
      quantity: item.quantity,
    };
  });
  return JSON.stringify(object);
}

async function createOrderDetails(file: string) {
  const csvRecords: any[] = [];
  try {
    // read config
    console.log('TikTok Order Staging Script');
    console.log('=====================');

    const rows = await parseCSV<TikTokOrder>(file);
    // check for the correct headers
    validateHeaders(Object.keys(rows[0]));
    console.log('CSV headers validated');
    console.log('================================');

    console.log('There are ', rows.length, 'rows in the CSV file');

    // match rows on Order ID
    const orders: Record<string, Order> = {};

    rows.forEach((row) => {
      const orderId = row['Order ID'].trim();

      // update existing order or create a new one
      if (!orders[orderId]) {
        const buyerEmail = row['Buyer Username'] + '@scs.tiktokw.us';
        const fullName = row['Recipient'].split(' ');
        orders[orderId] = {
          customer: {
            email: buyerEmail,
            firstName: fullName[0],
            lastName: fullName[1],
            // phone: row['Phone #'],
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

    // update with necessary fields for Shopify
    const orderIds = Object.keys(orders);
    console.log('There are ', orderIds.length, 'unique orders in the CSV file');
    console.log('=====================');
    console.log('Generating Order Inputs for Shopify...');

    for (const orderId of orderIds) {
      try {
        const order = orders[orderId];

        // check if order already exists by tag and return if it does
        // example tag: "TikTokOrderID:1234567890", escape quotes for search
        const existingOrder = await getOrderByTag(
          `\"TikTokOrderID:${orderId}\"`,
        );

        if (existingOrder) {
          // get tracking inforamation if it exists
          let trackingInfo: string | null = null;
          if (existingOrder.fulfillments.length > 0) {
            const fulfillment = existingOrder.fulfillments[0];
            if (fulfillment.trackingInfo.length > 0) {
              trackingInfo = fulfillment.trackingInfo[0].number as string;
            }
          }

          console.log(
            `Order with TikTokOrderID:${orderId} already exists in Shopify with ID ${existingOrder.id} | Tracking Info: ${trackingInfo}`,
          );

          // get order in netsuite
          const netsuiteData = await nsAuthenticatedFetch(
            process.env.NETSUITE_RESTLET_URL!,
            {
              orderNumber: existingOrder.name,
            },
          );

          const hasNetSuiteData =
            netsuiteData && netsuiteData.data && netsuiteData.data.length > 0;

          console.log('-------------------------------');
          console.log(
            `Netsuite data for order TikTokOrderID:${orderId}:`,
            hasNetSuiteData ? 'Data found' : 'No data found',
          );
          console.log('-------------------------------');

          const itemFulfillments = netsuiteData?.data || [];
          const ifs: {
            trandId: string;
            trackingNumbers: string;
            status: string;
          }[] = [];
          if (itemFulfillments.length > 0) {
            itemFulfillments.forEach(
              (fulfillment: NetSuiteResponse['data'][0]) => {
                ifs.push({
                  trandId: fulfillment.values.tranid as string,
                  trackingNumbers: fulfillment.values.trackingnumbers as string,
                  status: fulfillment.values.status[0].text as string,
                });
              },
            );
          }

          csvRecords.push({
            orderId: orderId,
            shopifyOrderId: existingOrder.id,
            name: existingOrder.name,
            status: 'Skipped',
            message: 'Order already exists in Shopify',
            skuIds: getTikTokSkuIds(order.lineItems),
            trackingInfo: trackingInfo,
            fulfillments: JSON.stringify(ifs),
          });

          continue; // skip to next order
        }

        // save new order details to csv
        csvRecords.push({
          orderId: orderId,
          shopifyOrderId: '',
          name: '',
          status: 'Not in Shopify',
          message: "Order doesn't exist in Shopify and failed to create",
          skuIds: getTikTokSkuIds(order.lineItems),
          trackingInfo: '',
          fulfillments: '',
        });
      } catch (err: any) {
        console.error(
          'Error generating input for order ',
          orderId,
          ': ',
          err.message,
        );
        // shouldn't need this
        csvRecords.push({
          orderId: orderId,
          shopifyOrderId: '',
          name: '',
          status: 'Failed',
          message: err.message,
          skuIds: getTikTokSkuIds(orders[orderId].lineItems),
          trackingInfo: '',
          fulfillments: '',
        });

        continue; // proceed to next order
      }
    }
  } catch (err: any) {
    console.error('Error processing orders:', err.message);
  }

  return csvRecords;
}

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'file is required' });
    }

    const csvString = req.file.buffer.toString('utf8');

    const csvRecords = await createOrderDetails(csvString);

    console.log('=====================');
    console.log('All orders processed. Output written to CSV Download:');

    // Create CSV string in memory
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'orderId', title: 'Order ID' },
        { id: 'shopifyOrderId', title: 'Shopify Order ID' },
        { id: 'name', title: 'Name' },
        { id: 'status', title: 'Status' },
        { id: 'message', title: 'Message' },
        { id: 'skuIds', title: 'SKU IDs' },
        { id: 'trackingInfo', title: 'Tracking Info' },
        { id: 'fulfillments', title: 'Fulfillments' },
      ],
    });

    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(csvRecords);
    const csvContent = headerString + recordsString;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=details.csv`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error in getOrderDetails:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
