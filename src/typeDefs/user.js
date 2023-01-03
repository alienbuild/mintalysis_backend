import { gql } from "apollo-server-express"

const typeDefs = gql`
    
    type Query {
        me: User
        profile(userId: ID!): Profile
        veveUser(username: String!): [String!]!
        veveVaultImport(payload: VaultImportInput) : VeveVaultImportPayload! #Auth only
    }
    
    type Mutation {
        avatarUpload(file: Upload) : AvatarUploadResponse #Auth only
    }

    type User {
        id: ID!
        username: String
        email: String!
        wallet_address: String
        stripe_customer_id: String
        profile: Profile
        role: String!
        tokens: [Token]!
        projects: [Project]
        veve_collectibles(pagingOptions: pagingOptions, sortOptions: sortOptions): CollectiblesConnection
    }

    type Profile {
        id: ID!
        bio: String
        isMyProfile: Boolean!
        user: User!
        onboarded: Boolean!
        avatar: String
        veve_wallet_address: String
        veve_project: Boolean!
        veve_username: String
    }

    type VeveVaultImportPayload {
        wallet_address: String!
        token_count: Int!
    }

    type AvatarUploadResponse {
        success: Boolean!
        message: String
        errorStatus: Boolean
        error: String
        token: String
    } 


`

export default typeDefs