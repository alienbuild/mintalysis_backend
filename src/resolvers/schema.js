import {gql} from "apollo-server-express"

export const typeDefs = gql`
    
    type Query {
        me: User
        veveUser(username: String!): [String!]!
        collectibles(search: String, limit: Int, after: String): CollectiblesConnection
        posts: [Post!]!
        profile(userId: ID!): Profile
        message(id: ID!): Message
    }
    
    type CollectiblesConnection {
        edges: [Collectible!]!
        pageInfo: PageInfo!
    }
    
    type PageInfo {
        endCursor: String
        hasMore: Boolean!
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
    }

    type Subscription {
        messageCreated: Message
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