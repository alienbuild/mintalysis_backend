import {gql} from "apollo-server-express"

export const typeDefs = gql`

    type Query {
        transfers(id: ID, limit: Int) : TransfersConnection
    }
    
    type Mutation {
        createVeveTransfer(transferInput: [VeveTransferInput]) : Boolean #Admin only
    }

    type Subscription { 
        createVeveTransfer: [VeveTransfer]
    }

    type TransfersConnection {
        edges: [VeveTransfer]!
        totalCount: Int
        pageInfo: PageInfo
    }

    type VeveTransfer {
        id: ID!
        from_user: String
        to_user: String
        timestamp: String
        token_id: String
        token: Token
    }

`

export default typeDefs