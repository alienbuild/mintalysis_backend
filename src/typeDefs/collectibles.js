import gql from "graphql-tag";

const typeDefs = gql`
    
    type Query {
        userCollectionsAndProjects: UserCollectionsAndProjects
        getCollection(id: ID!): UserCollection
        getCollections(page: Int, limit: Int): [UserCollection]
        getCollectible(id: ID!): PhysicalCollectible
    }
    
    type Mutation {
        addCollection(name: String!, description: String, image: Upload): UserCollection
        updateCollection(id: ID!, name: String, description: String, imageUrl: String): UserCollection
        deleteCollection(id: ID!): Boolean
        addCollectible(name: String!, description: String, collectionId: ID!): PhysicalCollectible
        updateCollectible(id: ID!, name: String, description: String): PhysicalCollectible
        deleteCollectible(id: ID!): Boolean
    }

    type UserCollectionsAndProjects {
        physicalCollections: [UserCollection]
        digitalProjects: [DigitalProject]
    }

    type DigitalProject {
        id: ID!
        name: String
        abbr: String
        active: Boolean
        icon: String
        slug: String
        sort: Int
        tile: String
        motiffUrl: String
        valuation: Float
        valuationWithFees: Float
    }

    type UserCollection {
        id: ID!
        name: String!
        description: String
        image_url: String
        collectibles: [PhysicalCollectible]
        createdAt: String
        updatedAt: String
    }

    type PhysicalCollectible {
        id: ID!
        name: String!
        description: String
        collection: UserCollection
        createdAt: String
        updatedAt: String
    }
    
`

export default typeDefs