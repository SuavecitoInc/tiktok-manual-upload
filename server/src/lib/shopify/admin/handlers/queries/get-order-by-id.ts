const query = `#graphql
  query GetOrderByID($id: ID!) {
    order(id: $id) {
      id
      fulfillments(first: 10) {
        id
        status
        createdAt
        updatedAt
        trackingInfo {
          number
          url
          company
        }
        fulfillmentLineItems(first: 20) {
          edges {
            node {
              id
              lineItem {
                id
                sku
                name
                quantity
              }
              quantity
            }
          }
        }
      }
    }
  }
`;

export default query;
