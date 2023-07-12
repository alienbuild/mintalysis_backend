import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getNotifications: [Notification]
    }
    
    type Mutation {
        createNotification: Boolean
    }
    
    type Subscription {
        notification: Boolean
    }
    
    type Notification {
        id: String
        type: String
        content: String
        reference: String
        read: Boolean
        createdAt: DateTime
        from_user: User
    }
`

export default typeDefs