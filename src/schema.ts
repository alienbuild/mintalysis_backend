import {gql} from "apollo-server"

export const typeDefs = gql`
    type Query {
        me: User
        posts: [Post!]!
        profile(userId: ID!): Profile
    }
    
    type Mutation {
        signup(credentials: CredentialsInput!) : AuthPayload!
        signin(credentials: CredentialsInput!) : AuthPayload
        postCreate(post: PostInput!): PostPayload!
        postUpdate(postId: ID!, post: PostInput!): PostPayload!
        postDelete(postId: ID!): PostPayload! 
        postPublish(postId: ID!) : PostPayload!
        postUnpublish(postId: ID!) : PostPayload!
    }
    
    type Post {
        id: ID!
        title: String!
        content: String!
        createdAt: String!
        published: Boolean!
        user: User!
    }
    
    type User {
        id: ID!
        name: String
        email: String!
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
        token: String
    }
    
    input PostInput {
        title: String
        content: String
    }
    
    input CredentialsInput {
        email: String!
        password: String!
    }

`