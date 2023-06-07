import gql from "graphql-tag"

const typeDefs = gql`

    type Mutation {
        addMarketProduct(product: MarketProductInput): Boolean
    }

`

export default typeDefs