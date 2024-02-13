import gql from "graphql-tag";

const typeDefs = gql`
    type Query {
        searchWalletsByTag(tagName: String!, visibility: Visibility): [VeveWallet]
    }
    
    type Mutation {
        addWalletTag(wallet_id: ID!, tag_name: String!, visibility: Visibility!): WalletTag
        updateWalletTagVisibility(wallet_id: ID!, tag_id: ID!, visibility: Visibility!): WalletTag
        removeWalletTag(wallet_id: ID!, tag_id: ID!): Boolean
    }

    type WalletTag {
        wallet_id: ID!
        tag_id: ID!
        visibility: Visibility!
    }

    enum Visibility {
        PUBLIC
        PRIVATE
    }
`

export default typeDefs