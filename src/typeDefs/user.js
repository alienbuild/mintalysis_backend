import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        me: User
        getUser(username: String!): UserConnection
        getUsers(pagingOptions: pagingOptions, sortOptions: sortOptions): UsersConnection
        searchUsers(username: String!): [User]
        getUserFollowing(userId: String! type: String) : User
        getUserCommunities(userId: String!): [Community]
        getUserProjects(userId: ID!): Boolean
        getUserAccessibilityPreferences: UserAccessibilityPreferences
    }
    
    type Mutation {
        avatarUpload(file: Upload) : AvatarUploadResponse #Auth only
        updateLastSeen(now: String) : Boolean
        followUser(userId: ID!) : Boolean
        unfollowUser(userId: ID!): Boolean
        saveUserAccessibilityPreferences(preferences: AccessibilityPreferencesInput!): Boolean
    }
    
    type Subscription {
        getOnlineUsers: [User]
    }
    
    type UserAccessibilityPreferences {
        screen_reader: Boolean
        magnifier: Boolean
        readable_font: Boolean
        img_descriptions: Boolean
        highlight_links: Boolean
        highlight_headers: Boolean
        text_magnifier: Boolean
        virtual_keyboard: Boolean
        monochrome: Boolean
        dark_contrast: Boolean
        light_contrast: Boolean
        cursor_type: String
    }

    type UsersConnection {
        edges: [User]!
        totalCount: Int
        pageInfo: PageInfo
    }

    type UserConnection {
        user: User,
        isMyProfile: Boolean
        userIsFollowing: Boolean
    }
    
    type User {
        id: ID!
        username: String
        avatar: String
        email: String!
        last_seen: DateTime 
        createdAt: DateTime
        updatedAt: DateTime
        cover_image: String
        ecomiwiki_user: Boolean
        activated: Boolean
        stripe_customer_id: String
        profile: Profile
        role: String!
        following: [FollowerConnection]
        followers: [FollowerConnection]
        tokens: [Token]!
        projects: [Project]
        posts: [Post]
        veve_collectibles(pagingOptions: pagingOptions, sortOptions: sortOptions): CollectiblesConnection
        veve_wallet: VeveWallet
        _count: UserCommunityStats
    }
    
    type UserCommunityStats {
        followers: Int
        following: Int
        posts: Int
        comments: Int
        projects: Int 
    }
    
    type FollowerConnection {
        follower: User
        following: User
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