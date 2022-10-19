const {gql} = require("apollo-server")

exports.typeDefs = gql`

    type Query {
        hello: [String]
        collectibles(filter: CollectiblesFilterInput): [Collectible!]!
        collectible(id: ID!): Collectible
        brands: [Brand!]!
        brand(id: ID!): Brand
    }

    type Collectible {
        id: ID!
        name: String!
        description: String!
        price: Float!
        soldOut: Boolean,
        brand: Brand
    }

    type Brand {
        id: ID!
        name: String!
        collectibles(filter: CollectiblesFilterInput): [Collectible!]!
    }
    
    input CollectiblesFilterInput {
        soldOut: Boolean
    }

`
