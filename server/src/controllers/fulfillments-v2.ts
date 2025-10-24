import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';

import { getOrderFulfillment } from '../lib/shopify/utils';
import { parseCSV } from '../lib/utils';
import type { Fulfillment, OrderRow } from '../lib/types/fulfillment';
import type { GetOrderByIdQuery } from '../lib/types/admin.generated';

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

type Shipment = {
  orderId: string;
  trackingId: string;
  provider: string;
  combineId: string;
};

async function generateShipmentWorkbook(shipments: Shipment[] = []) {
  const wb = new ExcelJS.Workbook();

  /* -------------------------------
     Sheet 1: "How to use it"
  -------------------------------- */
  const ws1 = wb.addWorksheet('How to use it');

  ws1.columns = [
    { key: 'A', width: 25 },
    { key: 'B', width: 100 },
    { key: 'C', width: 50 },
    { key: 'D', width: 30 },
    { key: 'E', width: 15 },
  ];

  ws1.mergeCells('A1:E1');
  ws1.mergeCells('A2:E7');
  ws1.mergeCells('A8:E8');

  const headerCell1 = ws1.getCell('A1');
  headerCell1.value = 'Instructions';
  headerCell1.font = { name: 'Calibri', size: 14, bold: true };
  headerCell1.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  };
  headerCell1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' },
  };

  const instr = `1. This upload template only applies to shipment of "Shipped by Seller" orders.
    2. Review the 'Data definitions' and 'Example of shipment' tabs.
    3. Export orders under the 'To ship' tab in Seller Center to get order details.
    4. For combined orders:
      - If multiple orders go to the same recipient, provide a Combine Group ID.
    5. Auto-combined orders will have "N/A" as Combine ID.`;

  const instrCell = ws1.getCell('A2');
  instrCell.value = instr;
  instrCell.font = { name: 'Calibri', size: 11 };
  instrCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

  const a8 = ws1.getCell('A8');
  a8.value = '';
  a8.alignment = { vertical: 'middle', horizontal: 'left' };

  const borderAll = (ws: ExcelJS.Worksheet, range: string) => {
    const [start, end] = range.split(':');
    const startCell = ws.getCell(start);
    const endCell = ws.getCell(end);
    // @ts-ignore
    for (let r = startCell.row; r <= endCell.row; r++) {
      // @ts-ignore
      for (let c = startCell.col; c <= endCell.col; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  };

  borderAll(ws1, 'A1:E1');
  borderAll(ws1, 'A2:E7');
  borderAll(ws1, 'A8:E8');

  /* -------------------------------
     Sheet 2: "Shipping info"
  -------------------------------- */
  const ws2 = wb.addWorksheet('Shipping info');
  ws2.columns = [
    { header: 'Order ID', key: 'orderId', width: 20 },
    { header: 'Tracking ID', key: 'trackingId', width: 35 },
    { header: 'Shipping Provider Name', key: 'provider', width: 30 },
    { header: 'Auto Combine Group ID', key: 'combineId', width: 25 },
  ];

  // Top note row
  ws2.mergeCells('A1:D1');
  const topNote = ws2.getCell('A1');
  topNote.value = 'Review the examples before you fill out this sheet.';
  topNote.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  };
  topNote.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5FF' },
  };
  topNote.font = { name: 'Calibri', size: 11 };

  // Header row
  const headerRow = ws2.getRow(2);
  // @ts-ignore
  headerRow.values = ws2.columns.map((c) => c.header);
  headerRow.font = { name: 'Calibri', size: 11, bold: true };
  headerRow.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  };
  headerRow.height = 20;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Freeze top rows
  ws2.views = [{ state: 'frozen', ySplit: 2 }];

  // Add each shipment
  let currentRow = 3;
  shipments.forEach((s) => {
    const row = ws2.addRow([
      s.orderId || '',
      s.trackingId || '',
      s.provider || '',
      s.combineId || '',
    ]);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    currentRow++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  console.log('✅ Workbook generation completed.');
  // return buffer or stream as needed
  return buffer;
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

export const createFulfillmentsControllerV2 = async (
  req: Request,
  res: Response,
) => {
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

    const xlsxBuffer = await generateShipmentWorkbook(
      fulfillments.map((f) => ({
        orderId: f.orderId,
        trackingId: f.trackingId,
        provider: f.shippingProviderName,
        combineId: f.autoCombineGroupId,
      })),
    );

    console.log('================================');
    console.log('All Fulfillments written to XLSX Download');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=process-fulfillments.xlsx`,
    );

    res.send(xlsxBuffer);
  } catch (err: any) {
    console.log('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
