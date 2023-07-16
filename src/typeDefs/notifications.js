import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getNotifications(filterOptions: filterOptions, pagingOptions: pagingOptions, sortOptions: sortOptions): NotificationConnection
    }
    
    type Mutation {
        createNotification: Boolean
    }
    
    type Subscription {
        notification: Boolean
    }
    
    type NotificationConnection {
        edges: [Notification]!
        pageInfo: PageInfo
    }
    
    type Notification {
        id: String
        type: String
        content: String
        reference: String
        read: Boolean
        createdAt: DateTime
        from_user: User
        project: Project
    }
`

export default typeDefs