import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        validateVeveUsername(username: String!): [String!]!
        veveCollectiblePriceData(collectibleId: String! type: String! period: DateTime): [VeveCollectiblePriceDataPayload]
    }
    
    type Mutation {
        veveVaultImport(payload: VaultImportInput) : VeveVaultImportPayload! #Auth only
        updateLastSeen(last_seen: String) : Boolean
    }
    
    type Subscription {
        veveCollectiblePrice(collectible_id: String): DateTime
        veveVaultImport: VeveVaultImportSubcriptionPayload
    }
    
    type VeveCollectiblePriceDataPayload { 
        _id: VeveCollectiblePriceDataPayloadId
        date: Float
        value: Float
        open: Float
        high: Float
        low: Float
        volume: Float
    }
    
    type VeveCollectiblePriceDataPayloadId { 
        symbol: String
        date: DateTime
    }

    type VeveVaultImportPayload {
        wallet_address: String!
        token_count: Int!
    }
    
    type VeveVaultImportSubcriptionPayload {
        user_id: String
        message: String
        complete: Boolean
    }
    
`

export default typeDefs