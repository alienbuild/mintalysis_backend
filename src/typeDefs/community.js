import gql from "graphql-tag";

const typeDefs = gql`
    
    type Query {
        getCommunity(community_name: String) : Community
        getPosts(user_id: ID, community_id: ID, project_id: ID) : [Post]
        getPost(post_id: ID!) : Post
        getComments(post_id: ID!, community_id: ID) : [Comment]
        getCommentReactions(comment_id: ID!) : [User]
        canViewCommunity(project_id: ID!, community_id: ID!): Boolean
    }
    
    type Mutation {
        createCommunity(payload: CreateCommunityPayload) : Community
        joinCommunity(community_id: ID!) : Boolean
        leaveCommunity(community_id: ID!) : Boolean
        createPost(payload: CreatePostPayload!) : Post
        deletePost(post_id: ID!) : Boolean
        likePost(post_id: ID!): Boolean
        unlikePost(post_id: ID!): Boolean
        createComment(parent_id: ID, post_id: ID, community_id: ID!, body: String) : Comment
        likeComment(comment_id: ID!) : Boolean
        unlikeComment(comment_id: ID!) : Boolean
    }
    
    type Community {
        id: String
        name: String
        slug: String
        type: String
        member_count: Int
        createdAt: DateTime
        project_id: String
        creator: User
        isMember: Boolean
        members: [User]
        veve_collectible: Collectible
    }
    
    type Post {
        id: String
        body: String
        createdAt: DateTime
        like_count: Int
        comment_count: Int
        image_url: String
        community_image_url: String
        community: Community
        author: User
        liked_by: [User]
        comments: [Comment]
    }
    
    type Comment {
        id: String
        author: User
        body: String
        createdAt: DateTime
        updatedAt: DateTime
        like_count: Int
        liked_by: [User]
        children: [Comment]
    }

    input CreateCommunityPayload {
        name: String
        type: String
        slug: String
        creator_id: String
        project_id: String
        member_count: Int
        gate_key: String
        veve_collectible_id: String
    }
    
    input CreatePostPayload { 
        community_id: String
        author_id: String
        body: String
        comment_count: Int
        like_count: Int
    }
    
`

export default typeDefs