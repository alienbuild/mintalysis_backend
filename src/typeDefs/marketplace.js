import gql from "graphql-tag"

const typeDefs = gql`

    type Query {
        getMarketProducts: [MarketProduct]
        getMarketProduct(id: ID!): MarketProduct
    }
    
    type Mutation {
        addMarketProduct(product: MarketProductInput): MarketProduct
    }
    
    type MarketProduct {
        id: String
        title: String
        description: String
        age: Int
        price: Float
        condition: String
        receipt_available: Boolean
        warranty_available: Boolean
        accessories_available: Boolean
        box_available: Boolean
        status: String
        seller: User
    }

`

export default typeDefs