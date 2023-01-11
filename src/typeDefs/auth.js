import gql from 'graphql-tag'

const typeDefs = gql`

    type Mutation {
        signup(credentials: CredentialsInput!) : AuthPayload!
        signin(credentials: CredentialsInput!) : AuthPayload
    }

    type AuthPayload {
        userErrors: [UserError!]!
        token: String,
        user: User
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