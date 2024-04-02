import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        me: User 
        getUser(userId: String!): UserConnection
        getUsers(pagingOptions: pagingOptions, sortOptions: sortOptions): UsersConnection
        searchUsers(username: String!): [User]
        getUserFollowing(userId: String! type: String) : User
        getUserCommunities(userId: String!): [Community]
        getUserProjects(userId: ID!): Boolean
        getUserAccessibilityPreferences: UserAccessibilityPreferences
        checkUsername(username: String!): Boolean
        getUserPreferences: UserPreferences
        getUserValuation: UserValuation

    }
    
    type Mutation {
        avatarUpload(file: Upload) : AvatarUploadResponse
        updateUsername(username: String!): Boolean
        updateLastSeen(now: String) : Boolean
        followUser(userId: ID!) : Boolean
        unfollowUser(userId: ID!): Boolean
        saveUserAccessibilityPreferences(preferences: AccessibilityPreferencesInput!): Boolean
        updateUserPreferences(preferences: PreferencesInput!): UserPreferences
        logoutAllOtherSessions: Boolean
        deleteUserAccount(userId: ID!): Boolean
        updateUserDetails(input: UpdateUserDetailsInput!): UserUpdateResponse!
       
    }
    
    type Subscription {
        userStatusChanged: User!
    }

    input UpdateUserDetailsInput {
        avatar: Upload
        username: String
        first_name: String
        last_name: String
    }

    input PreferencesInput {
        displayCurrency: Currency
        theme: Theme
        enableNotifications: Boolean
        language: Language
        layoutPreference: Layout
    }

    type UserValuation {
        valuation: Int
    }
    
    type UserUpdateResponse {
        success: Boolean!
        message: String
        user: User
    }

    type UserPreferences {
        id: ID!
        user_id: String!
        display_currency: Currency!
        theme: Theme!
        enable_notifications: Boolean!
        language: Language!
        layout_preference: Layout!
    }
    
    type UserAccessibilityPreferences {
        screen_reader: Boolean
        magnifier: Boolean
        readable_font: Boolean
        dyslexia_font: Boolean
        img_descriptions: Boolean
        highlight_links: Boolean
        highlight_headers: Boolean
        text_magnifier: Boolean
        virtual_keyboard: Boolean
        monochrome: Boolean
        dark_contrast: Boolean
        light_contrast: Boolean
        cursor_option: String
        font_size: Int
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
        status: String!
        createdAt: DateTime
        updatedAt: DateTime
        cover_image: String
        activated: Boolean
        features: UserFeatures
        profile: Profile
        role: String!
        newsletterSubscriber: NewsletterSubscriber
        following: [FollowerConnection]
        followers: [FollowerConnection]
        tokens: [Token]!
        projects: [Project]
        posts: [Post]
        veve_collectibles(pagingOptions: pagingOptions, sortOptions: sortOptions): CollectiblesConnection
        veve_wallet: VeveWallet
        servers: [Server!]
        direct_messages_sent: [DirectMessage!]
        direct_messages_received: [DirectMessage!]
        _count: UserCommunityStats
    }

    type UserFeatures {
        canAccessPremiumContent: Boolean
        canUseAdvancedFeatures: Boolean
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

    enum Currency {
        USD
        ETH
        BTC
        OMI
    }

    enum Theme {
        LIGHT
        DARK
    }

    enum Language {
        EN
        ES
        DE
        FR
        CN
        IN
        IT
        JP
    }

    enum Layout {
        STANDARD
        COMPACT
        DENSE
    }

`

export default typeDefs