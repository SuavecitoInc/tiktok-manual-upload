import fetch from 'node-fetch';
import { STORE, API_VERSION, ACCESS_TOKEN } from './const';
import {
  GetVariantBySku,
  GetOrderByTag,
  GetOrderByID,
} from './admin/handlers/queries';
import { OrderCreate } from './admin/handlers/mutations';
import type {
  GetOrderByTagQuery,
  GetVariantBySkuQuery,
  GetOrderByIdQuery,
  OrderCreateMutation,
} from '../types/admin.generated';

type JsonResponse<T> = { data: T; error?: any };

export async function fetchAdmin<T>(
  query: string,
  variables?: object,
): Promise<JsonResponse<T>> {
  const endpoint = `https://${STORE}.myshopify.com/admin/api/${API_VERSION}/graphql.json`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  return json as JsonResponse<T>;
}

export async function getVariantBySku(sku: string) {
  const response = await fetchAdmin<GetVariantBySkuQuery>(GetVariantBySku, {
    sku,
  });
  // get the exact variant from the response
  const variants = response.data.productVariants.edges;
  if (variants.length === 0) {
    throw new Error(`Variant with SKU ${sku} not found`);
  }
  let variant:
    | GetVariantBySkuQuery['productVariants']['edges'][0]['node']
    | null = null;
  variants.forEach(({ node }) => {
    if (node.sku === sku) {
      variant = node;
    }
  });
  if (!variant) {
    throw new Error(`Variant with SKU ${sku} not found`);
  }

  return variant as GetVariantBySkuQuery['productVariants']['edges'][0]['node'];
}

export async function getOrderByTag(tag: string) {
  const response = await fetchAdmin<GetOrderByTagQuery>(GetOrderByTag, {
    query: `tag:${tag}`,
  });
  const orders = response.data.orders.edges;
  if (orders.length === 0) {
    return null;
  }
  return orders[0].node;
}

export async function createOrder(orderInput: any) {
  const response = await fetchAdmin<OrderCreateMutation>(
    OrderCreate,
    orderInput,
  );
  return response;
}

export async function getOrderFulfillment(orderId: string) {
  const response = await fetchAdmin<GetOrderByIdQuery>(GetOrderByID, {
    id: orderId,
  });
  return response.data.order;
}
