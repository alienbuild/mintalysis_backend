import gql from "graphql-tag"

const typeDefs = gql`

    type Query {
        getMarketProduct(id: ID!): MarketProduct
        getMarketProducts(pagingOptions: pagingOptions, sortOptions: sortOptions): MarketProductConnection
    }
    
    type Mutation {
        addMarketProduct(product: MarketProductInput): MarketProduct
        updateMarketProduct(product: MarketProductInput) : MarketProduct
        removeMarketProduct(id: ID!): Boolean
        placeMarketOffer(id: ID!, offer: Float!, message: String, seller_id: String! ) : Boolean
    }
    
    type MarketProductConnection {
        edges: [MarketProduct]
        totalCount: Int
        pageInfo: PageInfo
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
        offers: [MarketProductOffer]
    }
    
    type MarketProductOffer {
        offer: Float!
        message: String
        createdAt: DateTime
        updatedAt: DateTime
        buyer: User
    }
    
    type MarketProductImages {
        url: String
    }

`

export default typeDefs