import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        me: User
        profile(userId: ID!): Profile
        searchUsers(username: String!): [User]
    }
    
    type Mutation {
        avatarUpload(file: Upload) : AvatarUploadResponse #Auth only
    }

    type User {
        id: ID!
        username: String
        avatar: String
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

    type AvatarUploadResponse {
        success: Boolean!
        message: String
        errorStatus: Boolean
        error: String
        token: String
    } 

`

export default typeDefs