import gql from "graphql-tag"

const typeDefs = gql`
    type Query {
        getWalletTransfers(walletId: ID, pagingOptions: pagingOptions, sortOptions: sortOptions) : TransfersConnection
        getImxVeveTransfers(id: ID, pagingOptions: pagingOptions, sortOptions: sortOptions) : TransfersConnection
        getImxVeveMints(id: ID, pagingOptions: pagingOptions, sortOptions: sortOptions) : MintsConnection
        getCollectibleDetails(tokenId: ID!): TokenDetails
        getImxVeveStats(project_id: String!): ImxStats
        getImxTxns: [VeveTransfer]
    }
    
    type Mutation {
        createVeveTransfer(transferInput: [VeveTransferInput]) : Boolean
    }

    type TokenDetails {
        edition: Int
        type: String
        collectible: Collectible
        comic: Comic
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
        imxVeveMintsUpdated: [VeveMint]
    }
    
    type MintsConnection {
        edges: [VeveMint]!
        totalCount: Int
        pageInfo: PageInfo
    }
    
    type VeveMint {
        id: ID!
        wallet_id: String
        timestamp: String
        token_id: String
        token: Token
        is_burned: Boolean
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
        timestamp_dt: DateTime
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