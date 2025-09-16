const query = `#graphql
  query GetVariantBySku($sku: String!) {
    productVariants(first: 5, query: $sku) {
      edges {
        node {
          id
          sku
          title
        }
      }
    }
  }
`;

export default query;
