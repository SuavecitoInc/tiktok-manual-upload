export type NetSuiteResponse = {
  data: {
    recordType: 'itemfulfillment';
    id: string;
    values: {
      internalid: [
        {
          value: string;
          text: string;
        },
      ];
      trandate: string;
      status: [
        {
          value: string;
          text: string;
        },
      ];
      tranid: string;
      entity: [
        {
          value: string;
          text: string;
        },
      ];
      'createdFrom.internalid': [
        {
          value: string;
          text: string;
        },
      ];
      'createdFrom.tranid': string;
      'createdFrom.custbody_sp_shopify_note_attr_0': string;
      'createdFrom.custbody_fa_channel_order': string;
      location: [
        {
          value: string;
          text: string;
        },
      ];
      trackingnumbers: string;
    };
  }[];
};
