import {gql} from "apollo-server-express"

export const typeDefs = gql`
    
    type Query {
        me: User
        veveUser(username: String!): [String!]!
        collectibles(id: ID, search: String, limit: Int, after: String): CollectiblesConnection
        comics(search: String, limit: Int, after: String) : ComicsConnection
        tokens(token_id: ID, editionNumber: Int, type: String, userId: String, search: String, limit: Int, after: String, collectibleId: String, uniqueCoverId: String, kraken: Boolean) : TokensConnection
        transfers(id: ID, limit: Int) : TransfersConnection
        posts: [Post!]!
        profile(userId: ID!): Profile
        projects(id: ID, name: String): [Project]
        message(id: ID!): Message
    }

    type Mutation {
        signup(credentials: CredentialsInput!) : AuthPayload!
        signin(credentials: CredentialsInput!) : AuthPayload
        veveVaultImport(payload: VaultImportInput) : VeveVaultImportPayload! #Auth only
        avatarUpload(file: Upload) : AvatarUploadResponse #Auth only
        postCreate(post: PostInput!): PostPayload! #Auth only
        postUpdate(postId: ID!, post: PostInput!): PostPayload! #Auth only
        postDelete(postId: ID!): PostPayload! #Auth only
        postPublish(postId: ID!) : PostPayload! #Auth only
        postUnpublish(postId: ID!) : PostPayload! #Auth only
        createComment(comment: CreateCommentInput!): Comment! #Auth only
        deleteComment(id: ID!): Comment! #Auth only
        updateComment(id: ID!, data: UpdateCommentInput!): Comment! #Auth only 
        createMessage(messageInput: MessageInput) : Message! #Auth only
        createVeveTransfer(transferInput: [VeveTransferInput]) : Boolean #Admin only
        createProject(name: String!, abbr: String, active: Boolean) : Project #Admin only
    }
    
    scalar Upload
    
    scalar DateTime

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

    input CredentialsInput {
        email: String!
        password: String!
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
    
    type Subscription { 
        messageCreated: Message
        createVeveTransfer: [VeveTransfer]
    }

    type CollectiblesConnection {
        edges: [Collectible!]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type ComicsConnection {
        edges: [Comic!]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type TokensConnection {
        edges: [Token]!
        totalCount: Int
        pageInfo: PageInfo!
        summary: WalletSummary
    }

    type TransfersConnection {
        edges: [VeveTransfer]!
        totalCount: Int
        pageInfo: PageInfo
    }

    type WalletSummary {
        valuation: Float
        count: Int
    }

    type PageInfo {
        endCursor: String
    }

    type VeveTransfer {
        id: ID!
        from_user: String
        to_user: String
        timestamp: String
        token_id: String
        token: Token
    }
    
    type AvatarUploadResponse {
        success: Boolean!
        message: String
        errorStatus: Boolean
        error: String
        token: String
    } 

    type Message {
        text: String
        createdBy: String
    }

    type VEVEValuationObj {
        low: Float,
        volume: Float,
        listings: Float,
        value: Float,
        open: Float,
        high: Float
        date: DateTime
    }

    type Collectible {
        collectible_id: String!
        name: String
        rarity: String
        description: String
        edition_type: String
        store_price: Float
        drop_date: String
        market_fee: Float
        createdAt: String
        updatedAt: String
        background_image_direction: String
        background_image_full_resolution_url: String
        background_image_high_resolution_url: String
        background_image_low_resolution_url: String
        background_image_med_resolution_url: String
        background_image_thumbnail_url: String
        background_image_url: String
        image_direction: String
        image_full_resolution_url: String
        image_high_resolution_url: String
        image_low_resolution_url: String
        image_med_resolution_url: String
        image_thumbnail_url: String
        image_url: String
        is_unlimited: Boolean
        total_available: Int
        total_issued: Int
        total_likes: Int
        variety: String
        brand_id: String
        licensor_id: String
        series_id: String
        drop_method: String
        is_free: String
        floor_price: Float
        market_cap: Float
        one_day_change: Float
        one_mo_change: Float
        one_wk_change: Float
        one_year_change: Float
        six_mo_change: Float
        three_mo_change: Float
        total_listings: Int
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
        valuations(period: Int) : [[VEVEValuationObj]]
    }
    
    type Comic {
        uniqueCoverId: String!
        name: String!
        rarity: String!
        description: String!
        comic_number: Int!
        comic_series_id: String!
        image_thumbnail: String!
        image_low_resolution_url: String
        image_med_resolution_url: String
        image_full_resolution_url: String
        image_high_resolution_url: String
        image_direction: String
        drop_date: String
        drop_method: String
        start_year: Int
        page_count: Int
        store_price: Float
        publisher_id: String
        market_fee: Float
        total_issued: Int
        total_available: Int
        is_free: Boolean
        is_unlimited: Boolean
        all_time_high: Float
        all_time_low: Float
        floor_price: Float
        market_cap: Float
        one_day_change: Float
        one_mo_change: Float
        one_wk_change: Float
        one_year_change: Float
        six_mo_change: Float
        three_mo_change: Float
        total_listings: Int
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
    }

    type Post {
        id: ID!
        title: String!
        content: String!
        createdAt: String!
        published: Boolean!
        user: User!
        comments: [Comment!]!
    }

    type Comment {
        id: ID!
        comment: String!
        author: User!
        post: Post!
    }

    type User {
        id: ID!
        username: String
        email: String!
        wallet_address: String
        stripe_customer_id: String
        posts: [Post!]!
        profile: Profile
        role: String!
        tokens: [Token]!
        projects: [Project]
        veve_collectibles(pagingOptions: pagingOptions, sortOptions: sortOptions): CollectiblesConnection
    }
    
    type Project {
        id: ID!
        name: String!
        abbr: String
        active: Boolean!
        users: [User]
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

    type UserError {
        message: String!
    }

    type PostPayload {
        userErrors: [UserError!]!
        post: Post
    }

    type AuthPayload {
        userErrors: [UserError!]!
        token: String,
        user: User
    }
    
    type VeveVaultImportPayload {
        wallet_address: String!
        token_count: Int!
    }
`