import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        tokens(token_id: ID, editionNumber: Int, type: String, userId: String, search: String, limit: Int, after: String, collectibleId: String, uniqueCoverId: String, kraken: Boolean) : TokensConnection
    }

    type TokensConnection {
        edges: [Token]!
        totalCount: Int
        pageInfo: PageInfo!
        summary: WalletSummary
    }

    type Token {
        token_id: ID!
        name: String
        edition: Int
        mint_date: String
        rarity: String
        collectibleId: String
        uniqueCoverId: String
        type: String
        last_updated: String
        brand_id: String
        licensor_id: String
        series_id: String
        collectible: Collectible
        comic: Comic
        tmp_unregistered_user: String
        tmp_wallet_address: String
    }

`

export default typeDefs