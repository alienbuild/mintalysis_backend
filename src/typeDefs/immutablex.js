import gql from "graphql-tag"

const typeDefs = gql`
    type Query {
        getImxVeveStats(project_id: String!): ImxStats
    }

    type ImxStats {
        tokenCount: Float
        walletCount: Float
        transactionCount: Float
        uniqueOwnersCount: Float
    }

    type Subscription {
        imxVeveStatsUpdated: ImxStats
    }
`

export default typeDefs