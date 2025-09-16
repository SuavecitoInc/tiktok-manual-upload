export type Order = {
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  shippingAddress: {
    address1: string;
    address2: string;
    city: string;
    provinceCode: string;
    zip: string;
    countryCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  lineItems: LineItem[];
  shippingLines: ShippingLine[];
  taxes: number;
  packageID: string;
};

export type LineItem = {
  title: string;
  sku: string;
  quantity: number;
  originalPrice: number;
  priceBeforeDiscount: number;
  priceAfterDiscount: number;
  ttSkuId: string;
  retailDeliveryFee: number;
};

export type ShippingLine = {
  title: string;
  originalShippingFee: number;
  shippingFeeAfterDiscount: number;
};
