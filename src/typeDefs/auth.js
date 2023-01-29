import gql from 'graphql-tag'

const typeDefs = gql`

    type Mutation {
        auth(credentials: CredentialsInput!) : AuthPayload!
    }

    type AuthPayload {
        userErrors: [UserError!]!
        success: Boolean
        domain: String
    }

#    Generic shit
    type UserError {
        message: String!
    }
    
    type PageInfo {
        endCursor: String
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