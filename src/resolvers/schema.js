import {gql} from "apollo-server-express"

export const typeDefs = gql`
    
    type Query {
        me: User
        veveUser(username: String!): [String!]!
        collectibles(search: String, limit: Int, after: String): CollectiblesConnection
        comics(search: String, limit: Int, after: String) : ComicsConnection
        tokens(token_id: ID, editionNumber: Int, type: String, userId: String, search: String, limit: Int, after: String, collectibleId: String, uniqueCoverId: String, kraken: Boolean) : TokensConnection
        transfers(id: ID, limit: Int) : TransfersConnection
        posts: [Post!]!
        profile(userId: ID!): Profile
        message(id: ID!): Message
    }
    
    type CollectiblesConnection {
        edges: [Collectible!]!
        pageInfo: PageInfo!
    }

    type ComicsConnection {
        edges: [Comic!]!
        pageInfo: PageInfo!
    }
    
    type TokensConnection {
        edges: [Token]!
        pageInfo: PageInfo!
        summary: WalletSummary
    }
     
    type TransfersConnection {
        edges: [VeveTransfer]!
        pageInfo: PageInfo
    }
    
    type WalletSummary {
        valuation: Float
        count: Int
    }
    
    type PageInfo {
        endCursor: String
    }

    type Mutation {
        signup(credentials: CredentialsInput!) : AuthPayload!
        signin(credentials: CredentialsInput!) : AuthPayload
        veveVaultImport(payload: VaultImportInput) : VeveVaultImportPayload!
        avatarUpload(file: Upload) : AvatarUploadResponse
        postCreate(post: PostInput!): PostPayload!
        postUpdate(postId: ID!, post: PostInput!): PostPayload!
        postDelete(postId: ID!): PostPayload!
        postPublish(postId: ID!) : PostPayload!
        postUnpublish(postId: ID!) : PostPayload!
        createComment(comment: CreateCommentInput!): Comment!
        deleteComment(id: ID!): Comment!
        updateComment(id: ID!, data: UpdateCommentInput!): Comment! 
        createMessage(messageInput: MessageInput) : Message!
        createVeveTransfer(transferInput: [VeveTransferInput]) : Boolean
    }

    type Subscription { 
        messageCreated: Message
        createVeveTransfer: [VeveTransfer]
    }
    
    input VeveTransferInput {
        id: ID!
        from_user: String
        to_user: String 
        timestamp: String
        token_id: Int
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
    
    scalar Upload

    type Message {
        text: String
        createdBy: String
    }

    input VaultImportInput {
        username: String
        edition: Int
        collectible_id: String
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
    
    type Collectible {
        collectible_id: String!
        name: String!
        rarity: String
        description: String!
        edition_type: String
        store_price: Float!
        drop_date: String!
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
        complete: Boolean!
        avatar: String
        wallet_address: String
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