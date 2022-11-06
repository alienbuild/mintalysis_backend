import {gql} from "apollo-server-express"

export const typeDefs = gql`
    type Query {
        me: User
        collectibles: [Collectible!]!
        posts: [Post!]!
        profile(userId: ID!): Profile
        message(id: ID!): Message
    }

    type Mutation {
        signup(credentials: CredentialsInput!) : AuthPayload!
        signin(credentials: CredentialsInput!) : AuthPayload
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

    type Message {
        text: String
        createdBy: String
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
        id: ID!
        collectible_id: String!
        name: String!
        rarity: String
        description: String!
        edition_type: String
        total_editions: Int!
        store_price: Float!
        drop_date: String!
        image_thumbnail: String
        image_full: String
        series_name: String
        series_id: String
        brand_name: String
        brand_id: String
        licensor_name: String
        licensor_id: String
        market_fee: Float
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
        stripe_customer_id: String,
        posts: [Post!]!
    }

    type Profile {
        id: ID!
        bio: String
        isMyProfile: Boolean!
        user: User!
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

`