import gql from 'graphql-tag'

const typeDefs = gql`
    type Conversations {
        id: String
    }
    
    type Query {
        conversations: [Conversation]
    }
    
    type Mutation {
        createConversation(participantIds: [String]): createConversationResponse
        markConversationAsRead(userId: String! conversationId: String!) : Boolean
        deleteConversation(conversationId: String!) : Boolean
    }
    
    type Subscription {
        conversationCreated: Conversation
        conversationUpdated: ConversationUpdatedPayload
        conversationDeleted: ConversationDeletedSubscriptionPayload
    }
    
    type ConversationDeletedSubscriptionPayload { 
        id: String
    }
     
    type ConversationUpdatedPayload {
        conversation: Conversation
    }
    
    type Conversation {
        id: String
        latest_message: Message
        participants: [Participant]
        createdAt: DateTime
        updatedAt: DateTime
    }
    
    type Participant {
        id: String
        user: User
        has_seen_latest_message: Boolean
    }
    
    type createConversationResponse {
        conversationId: String
    }
`

export default typeDefs