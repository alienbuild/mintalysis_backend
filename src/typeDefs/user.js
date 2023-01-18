import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        me: User
        findUserFollowing(userId: String!) : User
        profile(userId: ID!): Profile
        searchUsers(username: String!): [User]
        getUsers: [User]
    }
    
    type Mutation {
        avatarUpload(file: Upload) : AvatarUploadResponse #Auth only
        updateLastSeen(now: String) : Boolean
        followUser(userId: String!) : User
    }
    
    type Subscription {
        getOnlineUsers: [User]
    }

    type User {
        id: ID!
        username: String
        avatar: String
        email: String!
        last_seen: DateTime 
        wallet_address: String
        stripe_customer_id: String
        profile: Profile
        role: String!
        following: [User]
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