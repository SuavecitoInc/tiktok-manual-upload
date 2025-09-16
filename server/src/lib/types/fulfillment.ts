export type Fulfillment = {
  orderId: string;
  skuIdOptional: string;
  quantityOptional: string;
  trackingId: string;
  shippingProviderName: string;
  shippingServiceOptional: string;
  autoCombineGroupId: string;
};

export type OrderRow = {
  'Order ID': string;
  'Shopify Order ID': string;
  Status: string;
  Message: string;
};
