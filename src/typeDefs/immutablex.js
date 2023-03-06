import gql from "graphql-tag"

const typeDefs = gql`
    type Query {
        getWalletTransfers(walletId: ID, pagingOptions: pagingOptions, sortOptions: sortOptions) : TransfersConnection
        getImxVeveTransfers(id: ID, pagingOptions: pagingOptions, sortOptions: sortOptions) : TransfersConnection
        getImxVeveStats(project_id: String!): ImxStats
        getImxTxns: [VeveTransfer]
    }
    
    type Mutation {
        createVeveTransfer(transferInput: [VeveTransferInput]) : Boolean
    }
    
    type ImxStats {
        project_id: String
        token_count: Float
        wallet_count: Float
        transaction_count: Float
        unique_owners_count: Float
    }

    type Subscription {
        imxVeveStatsUpdated: ImxStats
        imxVeveTxnsUpdated: [VeveTransfer]
    }
    
    type TransfersConnection {
        edges: [VeveTransfer]!
        totalCount: Int
        pageInfo: PageInfo
    }

    type VeveTransfer {
        id: ID!
        from_wallet: String
        to_wallet: String
        timestamp: String
        token_id: String
        token: Token
        tags: [WalletTags]
    }
    
    type WalletTags {
        from_wallet: Tag!
        to_wallet: Tag!
    }
    
    type Tag {
        tag: String
    }
`

export default typeDefs