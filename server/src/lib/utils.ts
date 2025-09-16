import path from 'path';
import csv from 'csvtojson';
import { createObjectCsvWriter } from 'csv-writer';
import { getVariantBySku } from './shopify/utils';
import type { LineItem, ShippingLine } from './types/order';
import { ObjectMap } from 'csv-writer/src/lib/lang/object';
import { CsvWriter } from 'csv-writer/src/lib/csv-writer';
import { json } from 'stream/consumers';

export const parseCSV = async <Row>(fileAsString: string) => {
  const rows = await csv().fromString(fileAsString);
  return rows as Row[];
};

export const initializeCSV = (
  fileName: string,
  header: { id: string; title: string }[],
) => {
  return createObjectCsvWriter({
    path: path.join(__dirname, `../../output/${fileName}.csv`),
    header,
    append: false, // append if file exists
  });
};

export const writeToCSV = async (
  csvWriter: CsvWriter<ObjectMap<any>>,
  records: any[],
) => {
  await csvWriter.writeRecords(records);
};

export const getStateCode = (state: string) => {
  const states: { [key: string]: string } = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  };
  return states[state] || '';
};

export const getCountryCode = (country: string) => {
  const countries: { [key: string]: string } = {
    Afghanistan: 'AF',
    Albania: 'AL',
    Algeria: 'DZ',
    Andorra: 'AD',
    Angola: 'AO',
    'Antigua and Barbuda': 'AG',
    Argentina: 'AR',
    Armenia: 'AM',
    Australia: 'AU',
    Austria: 'AT',
    Azerbaijan: 'AZ',
    Bahamas: 'BS',
    Bahrain: 'BH',
    Bangladesh: 'BD',
    Barbados: 'BB',
    Belarus: 'BY',
    Belgium: 'BE',
    Belize: 'BZ',
    Benin: 'BJ',
    Bhutan: 'BT',
    Bolivia: 'BO',
    'Bosnia and Herzegovina': 'BA',
    Botswana: 'BW',
    Brazil: 'BR',
    Brunei: 'BN',
    Bulgaria: 'BG',
    'Burkina Faso': 'BF',
    Burundi: 'BI',
    'Cabo Verde': 'CV',
    Cambodia: 'KH',
    Cameroon: 'CM',
    Canada: 'CA',
    'Central African Republic': 'CF',
    Chad: 'TD',
    Chile: 'CL',
    China: 'CN',
    Colombia: 'CO',
    Comoros: 'KM',
    'Congo (Congo-Brazzaville)': 'CG',
    'Congo (Democratic Republic)': 'CD',
    'Costa Rica': 'CR',
    Croatia: 'HR',
    Cuba: 'CU',
    Cyprus: 'CY',
    'Czechia (Czech Republic)': 'CZ',
    Denmark: 'DK',
    Djibouti: 'DJ',
    Dominica: 'DM',
    'Dominican Republic': 'DO',
    Ecuador: 'EC',
    Egypt: 'EG',
    'El Salvador': 'SV',
    'Equatorial Guinea': 'GQ',
    Eritrea: 'ER',
    Estonia: 'EE',
    Eswatini: 'SZ',
    Ethiopia: 'ET',
    Fiji: 'FJ',
    Finland: 'FI',
    France: 'FR',
    Gabon: 'GA',
    Gambia: 'GM',
    Georgia: 'GE',
    Germany: 'DE',
    Ghana: 'GH',
    Greece: 'GR',
    Grenada: 'GD',
    Guatemala: 'GT',
    Guinea: 'GN',
    'Guinea-Bissau': 'GW',
    Guyana: 'GY',
    Haiti: 'HT',
    Honduras: 'HN',
    Hungary: 'HU',
    Iceland: 'IS',
    India: 'IN',
    Indonesia: 'ID',
    Iran: 'IR',
    Iraq: 'IQ',
    Ireland: 'IE',
    Israel: 'IL',
    Italy: 'IT',
    Jamaica: 'JM',
    Japan: 'JP',
    Jordan: 'JO',
    Kazakhstan: 'KZ',
    Kenya: 'KE',
    Kiribati: 'KI',
    Kuwait: 'KW',
    Kyrgyzstan: 'KG',
    Laos: 'LA',
    Latvia: 'LV',
    Lebanon: 'LB',
    Lesotho: 'LS',
    Liberia: 'LR',
    Libya: 'LY',
    Liechtenstein: 'LI',
    Lithuania: 'LT',
    Luxembourg: 'LU',
    Madagascar: 'MG',
    Malawi: 'MW',
    Malaysia: 'MY',
    Maldives: 'MV',
    Mali: 'ML',
    Malta: 'MT',
    'Marshall Islands': 'MH',
    Mauritania: 'MR',
    Mauritius: 'MU',
    Mexico: 'MX',
    Micronesia: 'FM',
    Moldova: 'MD',
    Monaco: 'MC',
    Mongolia: 'MN',
    Montenegro: 'ME',
    Morocco: 'MA',
    Mozambique: 'MZ',
    'Myanmar (Burma)': 'MM',
    Namibia: 'NA',
    Nauru: 'NR',
    Nepal: 'NP',
    Netherlands: 'NL',
    'New Zealand': 'NZ',
    Nicaragua: 'NI',
    Niger: 'NE',
    Nigeria: 'NG',
    'North Korea': 'KP',
    'North Macedonia': 'MK',
    Norway: 'NO',
    Oman: 'OM',
    Pakistan: 'PK',
    Palau: 'PW',
    'Palestine State': 'PS',
    Panama: 'PA',
    'Papua New Guinea': 'PG',
    Paraguay: 'PY',
    Peru: 'PE',
    Philippines: 'PH',
    Poland: 'PL',
    Portugal: 'PT',
    Qatar: 'QA',
    Romania: 'RO',
    Russia: 'RU',
    Rwanda: 'RW',
    'Saint Kitts and Nevis': 'KN',
    'Saint Lucia': 'LC',
    'Saint Vincent and the Grenadines': 'VC',
    Samoa: 'WS',
    'San Marino': 'SM',
    'Sao Tome and Principe': 'ST',
    'Saudi Arabia': 'SA',
    Senegal: 'SN',
    Serbia: 'RS',
    Seychelles: 'SC',
    'Sierra Leone': 'SL',
    Singapore: 'SG',
    Slovakia: 'SK',
    Slovenia: 'SI',
    'Solomon Islands': 'SB',
    Somalia: 'SO',
    'South Africa': 'ZA',
    'South Korea': 'KR',
    'South Sudan': 'SS',
    Spain: 'ES',
    'Sri Lanka': 'LK',
    Sudan: 'SD',
    Suriname: 'SR',
    Sweden: 'SE',
    Switzerland: 'CH',
    Syria: 'SY',
    Taiwan: 'TW',
    Tajikistan: 'TJ',
    Tanzania: 'TZ',
    Thailand: 'TH',
    'Timor-Leste': 'TL',
    Togo: 'TG',
    Tonga: 'TO',
    'Trinidad and Tobago': 'TT',
    Tunisia: 'TN',
    Turkey: 'TR',
    Turkmenistan: 'TM',
    Tuvalu: 'TV',
    Uganda: 'UG',
    Ukraine: 'UA',
    'United Arab Emirates': 'AE',
    'United Kingdom': 'GB',
    'United States': 'US',
    Uruguay: 'UY',
    Uzbekistan: 'UZ',
    Vanuatu: 'VU',
    'Vatican City': 'VA',
    Venezuela: 'VE',
    Vietnam: 'VN',
    Yemen: 'YE',
    Zambia: 'ZM',
    Zimbabwe: 'ZW',
  };
  return countries[country] || '';
};

export const getTaxRate = (
  itemsTotal: number,
  shippingTotal: number,
  taxTotal: number,
) => {
  if (taxTotal === 0 || itemsTotal + shippingTotal === 0) return 0;
  // rounded items total
  const roundedItemsTotal = parseFloat(itemsTotal.toFixed(2)); // required due to floating point precision issues
  const taxableTotal = roundedItemsTotal + shippingTotal;

  return taxTotal / taxableTotal;
};

export const createOrderLineItems = async (
  lines: LineItem[],
  taxRate: number,
  currency: string = 'USD',
  disableAmounts: boolean = false,
) => {
  // Map over lines and create promises
  const linePromises = lines.map(async (line) => {
    // throw error if line.sku is empty
    if (!line.sku) throw new Error(`SKU is empty for line item: ${line.title}`);

    // fetch variant by sku
    const variant = await getVariantBySku(line.sku); // fetch variant ID
    if (!variant) throw new Error(`Variant not found for SKU: ${line.sku}`);

    if (disableAmounts || line.priceAfterDiscount === 0) {
      return {
        variantId: variant.id,
        priceSet: {
          shopMoney: {
            amount: 0,
            currencyCode: currency,
          },
        },
        quantity: line.quantity,
        requiresShipping: true,
      };
    }

    const lineTotalAmount = parseFloat(
      (line.priceAfterDiscount * line.quantity).toFixed(2),
    );

    const lineTaxAmount = parseFloat((lineTotalAmount * taxRate).toFixed(2));

    return {
      variantId: variant.id,
      priceSet: {
        shopMoney: {
          amount: line.priceAfterDiscount,
          currencyCode: currency,
        },
      },
      quantity: line.quantity,
      taxLines: [
        {
          title: `Product Sales tax: ${line.title}`,
          rate: parseFloat((taxRate * 100).toFixed(2)) / 100, // rounded tax rate
          priceSet: {
            shopMoney: {
              amount: lineTaxAmount,
              currencyCode: currency,
            },
          },
        },
      ],
      requiresShipping: true,
    };
  });

  // Wait for all promises to resolve
  const orderLineItems = await Promise.all(linePromises);
  return orderLineItems;
};

export const createShippingLines = (
  lines: ShippingLine[],
  taxRate: number,
  currency: string = 'USD',
  disableAmounts: boolean = false,
) => {
  return lines.map((line) => {
    if (disableAmounts || line.shippingFeeAfterDiscount === 0) {
      return {
        title: line.title,
        priceSet: {
          shopMoney: {
            amount: 0,
            currencyCode: currency,
          },
        },
      };
    }

    const lineTaxAmount = parseFloat(
      (line.shippingFeeAfterDiscount * taxRate).toFixed(2),
    );

    return {
      title: line.title,
      priceSet: {
        shopMoney: {
          amount: line.shippingFeeAfterDiscount,
          currencyCode: currency,
        },
      },
      taxLines: [
        {
          title: 'Shipping fee tax',
          rate: parseFloat((taxRate * 100).toFixed(2)) / 100, // rounded tax rate
          priceSet: {
            shopMoney: {
              amount: lineTaxAmount,
              currencyCode: currency,
            },
          },
        },
      ],
    };
  });
};
