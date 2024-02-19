import gql from 'graphql-tag'

const typeDefs = gql`

    type Query {
        getCurrencyRates: CurrencyRate!
    }

    type CurrencyRate {
        id: ID!
        eth_to_usd: Float!
        btc_to_usd: Float!
        omi_to_usd: Float!
        updatedAt: String!
    }
    
`

export default typeDefs