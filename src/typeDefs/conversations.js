import { gql } from "apollo-server-express"

const typeDefs = gql`
    type Conversations {
        id: String
    }
    
    type Query {
        searchConversations: String
    }
    
    type Mutation {
        createConversation(username: String): String
    }
`

export default typeDefs