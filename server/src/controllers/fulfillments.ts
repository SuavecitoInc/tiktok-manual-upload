import * as XLSX from 'xlsx';
import fs from 'fs';
import { TIK_TOK_CONFIG } from '../config';
import { getOrderFulfillment } from '../lib/shopify/utils';
import { parseCSV } from '../lib/utils';
import type { Fulfillment, OrderRow } from '../lib/types/fulfillment';
import type { GetOrderByIdQuery } from '../lib/types/admin.generated';

const { fileNames } = TIK_TOK_CONFIG;

// initalize output csv
const fulfillmentsExport = `${fileNames.input}-fulfillments`;

function getTrackingFromFulfillments(
  // @ts-expect-error - its fine
  fulfillments: GetOrderByIdQuery['order']['fulfillments'],
) {
  const trackingInfoList: {
    sku: string;
    quantity: number;
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
  }[] = [];
  for (const fulfillment of fulfillments) {
    const { fulfillmentLineItems, trackingInfo } = fulfillment;

    fulfillmentLineItems.edges.forEach(
      (item: {
        node: {
          id: string;
          quantity: number;
          lineItem: {
            id: string;
            sku: string;
            name: string;
            quantity: number;
          };
        };
      }) => {
        trackingInfoList.push({
          sku: item.node.lineItem.sku,
          quantity: item.node.quantity,
          trackingNumber:
            trackingInfo && trackingInfo.length > 0
              ? trackingInfo[0].number
              : 'N/A',
          trackingUrl:
            trackingInfo && trackingInfo.length > 0
              ? trackingInfo[0].url
              : 'N/A',
          carrier:
            trackingInfo && trackingInfo.length > 0
              ? trackingInfo[0].company
              : 'N/A',
        });
      },
    );
  }
  return trackingInfoList;
}

function validateHeaders(headers: string[]) {
  const requiredHeaders = ['Order ID', 'Shopify Order ID', 'SKU IDs'];
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    console.log('CSV headers validation failed');
    const error = `Missing required headers: ${missingHeaders.join(', ')}`;
    throw new Error(error);
  }
}

export const createFulfillmentsController = async (req: any, res: any) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'file is required' });
    }

    console.log('TikTok Fulfillment CSV Generator');
    console.log('================================');

    const csvString = req.file.buffer.toString('utf8');

    const rows = await parseCSV<OrderRow>(csvString);
    // check for the correct headers
    validateHeaders(Object.keys(rows[0]));
    console.log('CSV headers validated');
    console.log('================================');

    console.log('There are ', rows.length, 'rows in the CSV file');

    const fulfillments: Fulfillment[] = [];

    for (const row of rows) {
      const shopifyOrderId = row['Shopify Order ID'];
      if (!shopifyOrderId) {
        console.log('Skipping row with no Shopify Order ID:', row);
        continue;
      }

      const order = await getOrderFulfillment(shopifyOrderId);
      if (!order?.fulfillments?.length) {
        console.log(
          'No fulfillments found for TikTok order:',
          row['Order ID'],
          ', Shopify order:',
          shopifyOrderId,
        );
        continue;
      }

      const trackingInfoList = getTrackingFromFulfillments(order.fulfillments);
      if (!trackingInfoList.length) {
        console.log('No tracking info found for order:', shopifyOrderId);
        continue;
      }

      let skuIdObj: Record<string, { skuId: string; quantity: number }> = {};
      try {
        // @ts-expect-error - its fine
        skuIdObj = JSON.parse(row['SKU IDs'] || '{}');
      } catch {
        console.log('Error parsing SKU IDs for TikTok order:', row['Order ID']);
        continue;
      }

      for (const trackingInfo of trackingInfoList) {
        const { sku, quantity, trackingNumber, carrier } = trackingInfo;
        const tikTokSkuId = skuIdObj[sku]?.skuId || '';
        if (!tikTokSkuId) {
          console.log(
            `SKU ${sku} from Shopify order ${shopifyOrderId} not found in TikTok SKU IDs for TikTok order ${row['Order ID']}`,
          );
          continue;
        }

        fulfillments.push({
          orderId: row['Order ID'],
          skuIdOptional: tikTokSkuId,
          quantityOptional: quantity.toString(),
          trackingId: trackingNumber || '',
          shippingProviderName: carrier || '',
          shippingServiceOptional: '',
          autoCombineGroupId: 'N/A',
        });

        console.log(
          `Fulfillment for TikTok order: ${row['Order ID']}, Shopify order: ${shopifyOrderId} added.`,
        );
      }
    }

    // Build XLSX in memory
    const headers = [
      'Order ID',
      'SKU ID(optional)',
      'Quantity(optional)',
      'Tracking ID',
      'Shipping Provider Name',
      'Shipping Service(optional)',
      'Auto Combine Group ID',
    ];

    const sheetData = [
      headers,
      ...fulfillments.map((f) => [
        f.orderId,
        f.skuIdOptional,
        f.quantityOptional,
        f.trackingId,
        f.shippingProviderName,
        f.shippingServiceOptional,
        f.autoCombineGroupId,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipping info');

    const xlsxBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    console.log('================================');
    console.log('All Fulfillments written to XLSX Download');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileNames.output}-fulfillments.xlsx`,
    );

    res.send(xlsxBuffer);
  } catch (err: any) {
    console.log('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
