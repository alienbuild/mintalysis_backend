import gql from 'graphql-tag'

const typeDefs = gql`
    input VeveTransferInput {
        id: ID!
        from_user: String
        to_user: String
        timestamp: String
        token_id: Int
    }

    input VaultImportInput {
        username: String
        edition: Int
        collectible_id: String
        project_id: String
        kraken: Boolean
    }

    input MessageInput {
        text: String
        username: String
    }

    input PostInput {
        title: String
        content: String
    }

    input CreateCommentInput {
        text: String!
        author: ID!
        post: ID!
    }

    input UpdateCommentInput {
        text: String
    }

    input pagingOptions {
        limit: Int
        after: String
    }
    
    input sortOptions {
        sortBy: String
        sortDirection: String
    }
    
    input filterOptions {
        underRRP: Boolean
    }

    input CredentialsInput {
        email: String!
        mobile: Boolean
    }
    
    input MarketProductInput {
        title: String!
        description: String
        age: Int
        price: Int
        category: String
        condition: String
        receipt_available: Boolean
        warranty_available: Boolean
        box_available: Boolean
        accessories_available: Boolean
    }

`

export default typeDefs