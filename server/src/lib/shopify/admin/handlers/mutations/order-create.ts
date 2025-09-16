const mutation = `#graphql
  mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      userErrors {
        field
        message
      }
      order {
        id
        totalTaxSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 5) {
          nodes {
            variant {
              id
            }
            id
            title
            quantity
            taxLines {
              title
              rate
              priceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default mutation;
