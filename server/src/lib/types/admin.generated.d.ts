/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type OrderCreateMutationVariables = AdminTypes.Exact<{
  order: AdminTypes.OrderCreateOrderInput;
  options?: AdminTypes.InputMaybe<AdminTypes.OrderCreateOptionsInput>;
}>;


export type OrderCreateMutation = { orderCreate?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.OrderCreateUserError, 'field' | 'message'>>, order?: AdminTypes.Maybe<(
      Pick<AdminTypes.Order, 'id'>
      & { totalTaxSet?: AdminTypes.Maybe<{ shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }>, lineItems: { nodes: Array<(
          Pick<AdminTypes.LineItem, 'id' | 'title' | 'quantity'>
          & { variant?: AdminTypes.Maybe<Pick<AdminTypes.ProductVariant, 'id'>>, taxLines: Array<(
            Pick<AdminTypes.TaxLine, 'title' | 'rate'>
            & { priceSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> } }
          )> }
        )> } }
    )> }> };

export type GetOrderByIdQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type GetOrderByIdQuery = { order?: AdminTypes.Maybe<(
    Pick<AdminTypes.Order, 'id'>
    & { fulfillments: Array<(
      Pick<AdminTypes.Fulfillment, 'id' | 'status' | 'createdAt' | 'updatedAt'>
      & { trackingInfo: Array<Pick<AdminTypes.FulfillmentTrackingInfo, 'number' | 'url' | 'company'>>, fulfillmentLineItems: { edges: Array<{ node: (
            Pick<AdminTypes.FulfillmentLineItem, 'id' | 'quantity'>
            & { lineItem: Pick<AdminTypes.LineItem, 'id' | 'sku' | 'name' | 'quantity'> }
          ) }> } }
    )> }
  )> };

export type GetOrderByTagQueryVariables = AdminTypes.Exact<{
  query: AdminTypes.Scalars['String']['input'];
}>;


export type GetOrderByTagQuery = { orders: { edges: Array<{ node: Pick<AdminTypes.Order, 'id' | 'name' | 'tags'> }> } };

export type GetVariantBySkuQueryVariables = AdminTypes.Exact<{
  sku: AdminTypes.Scalars['String']['input'];
}>;


export type GetVariantBySkuQuery = { productVariants: { edges: Array<{ node: Pick<AdminTypes.ProductVariant, 'id' | 'sku' | 'title'> }> } };

interface GeneratedQueryTypes {
  "#graphql\n  query GetOrderByID($id: ID!) {\n    order(id: $id) {\n      id\n      fulfillments(first: 10) {\n        id\n        status\n        createdAt\n        updatedAt\n        trackingInfo {\n          number\n          url\n          company\n        }\n        fulfillmentLineItems(first: 20) {\n          edges {\n            node {\n              id\n              lineItem {\n                id\n                sku\n                name\n                quantity\n              }\n              quantity\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetOrderByIDQuery, variables: GetOrderByIDQueryVariables},
  "#graphql\n  query GetOrderByTag($query: String!) {\n    orders(first: 10, query: $query) {\n      edges {\n        node {\n          id\n          name\n          tags\n          # Add other order fields you need here\n        }\n      }\n    }\n  }\n": {return: GetOrderByTagQuery, variables: GetOrderByTagQueryVariables},
  "#graphql\n  query GetVariantBySku($sku: String!) {\n    productVariants(first: 5, query: $sku) {\n      edges {\n        node {\n          id\n          sku\n          title\n        }\n      }\n    }\n  }\n": {return: GetVariantBySkuQuery, variables: GetVariantBySkuQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {\n    orderCreate(order: $order, options: $options) {\n      userErrors {\n        field\n        message\n      }\n      order {\n        id\n        totalTaxSet {\n          shopMoney {\n            amount\n            currencyCode\n          }\n        }\n        lineItems(first: 5) {\n          nodes {\n            variant {\n              id\n            }\n            id\n            title\n            quantity\n            taxLines {\n              title\n              rate\n              priceSet {\n                shopMoney {\n                  amount\n                  currencyCode\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: OrderCreateMutation, variables: OrderCreateMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
