import {gql} from "apollo-server-express";

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

    input sortOptions {
        sortDirection: String!
        sortField: String!
    }

    input pagingOptions {
        limit: Int
        after: String
    }

    input CredentialsInput {
        email: String!
        password: String!
    }

`

export default typeDefs