import gql from 'graphql-tag'

const typeDefs = gql`

    type Query {
        validate: Boolean
    }
    
    type Mutation {
        auth(credentials: CredentialsInput!) : AuthPayload!
    }

    type AuthPayload {
        userErrors: [UserError!]!
        success: Boolean
        domain: String
    }

    type UserError {
        message: String!
    }
    
    type PageInfo {
        endCursor: String
        totalCount: Int
    }

    type WalletSummary {
        valuation: Float
        count: Int
    }

    type VEVEValuationObj {
        low: Float,
        volume: Float,
        listings: Float,
        value: Float,
        open: Float,
        high: Float
        date: DateTime
    }
    
`

export default typeDefs