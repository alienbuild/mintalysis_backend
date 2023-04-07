import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        me: User
        findUserFollowing(userId: String!) : User
        getUser(userId: ID): User
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
        createdAt: DateTime
        updatedAt: DateTime
        ecomiwiki_user: Boolean
        activated: Boolean
        stripe_customer_id: String
        profile: Profile
        role: String!
        following: [User]
        tokens: [Token]!
        projects: [Project]
        veve_collectibles(pagingOptions: pagingOptions, sortOptions: sortOptions): CollectiblesConnection
        veve_wallet: VeveWallet
    }
    
    type VeveWallet {
        id: ID!
        user_id: String
        createdAt: DateTime
        updatedAt: DateTime
        veve_username: String
        veve_id: String
        active: Boolean
        last_active: DateTime
        first_activity_date: DateTime
        last_activity_date: DateTime
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
        veve_wallet: VeveWallet
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