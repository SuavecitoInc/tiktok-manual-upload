const query = `#graphql
  query GetOrderByTag($query: String!) {
    orders(first: 10, query: $query) {
      edges {
        node {
          id
          name
          tags
          # Add other order fields you need here
        }
      }
    }
  }
`;

export default query;
