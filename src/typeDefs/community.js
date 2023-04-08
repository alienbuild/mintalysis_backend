import gql from "graphql-tag";

const typeDefs = gql`
    
    type Query {
        getCommunity(community_name: String) : Community
        getPosts(community_id: ID) : [Post]
    }
    
    type Mutation {
        createCommunity(payload: CreateCommunityPayload!) : Community
        joinCommunity(community_id: ID!) : Boolean
        leaveCommunity(community_id: ID!) : Boolean
        createPost(payload: CreatePostPayload!) : Post
    }
    
    type Community {
        id: String
        name: String
        slug: String
        type: String
        member_count: Int
        createdAt: DateTime
        creator: User
        isMember: Boolean
        members: [User]
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
    }

    input CreateCommunityPayload {
        name: String
        type: String
        slug: String
        creator_id: String
        member_count: Int
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