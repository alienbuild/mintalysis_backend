import { gql } from "apollo-server-express"

const typeDefs = gql`
    type Conversations {
        id: String
    }
    
    type Query {
        searchConversations: String
    }
    
    type Mutation {
        createConversation(participantIds: [String]): createConversationResponse
    }
    
    type createConversationResponse {
        conversationId: String
    }
`

export default typeDefs