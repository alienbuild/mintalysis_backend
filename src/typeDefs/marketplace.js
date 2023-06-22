import gql from "graphql-tag"

const typeDefs = gql`

    type Query {
        getMarketProducts: [MarketProduct]
        getMarketProduct(id: ID!): MarketProduct
    }
    
    type Mutation {
        addMarketProduct(product: MarketProductInput): MarketProduct
        updateMarketProduct(product: MarketProductInput) : MarketProduct
        removeMarketProduct(id: ID!): Boolean
    }
    
    type MarketProduct {
        id: ID
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
        createdAt: DateTime
        updatedAt: DateTime
        images: [MarketProductImages]
    }
    
    type MarketProductImages {
        url: String
    }

`

export default typeDefs