import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getUserServers(userId: ID!): [Server!]
        getServers: [Server!]!
        getServerChannels(serverId: ID!): [Channel!]
        getChannelMessages(channelId: ID!, limit: Int, cursor: ID): [ChannelMessage!]
    }

    type Mutation {
        createServer(name: String!, ownerId: ID!): Server!
        createChannel(name: String!, serverId: ID!): Channel!
        sendDirectMessage(content: String!, senderId: ID!, receiverId: ID!): DirectMessage!
        sendChannelMessage(content: String!, userId: ID!, channelId: ID!): ChannelMessage!
        updateLastRead(userId: ID!, channelId: ID!): LastReadUpdateResponse!
    }

    type LastReadUpdateResponse {
        success: Boolean!
        message: String
        lastRead: DateTime
    }
 
    type Subscription {
        mintSyncMessageSent(channelId: ID!): ChannelMessage!
        directMessageSent(receiverId: ID!): DirectMessage!
        lastReadUpdated(userId: ID!): LastReadUpdate!
    }

    type LastReadUpdate {
        userId: ID!
        channelId: ID!
        lastRead: DateTime!
    }
    
    type DirectMessage {
        id: ID!
        content: String!
        sender: User!
        receiver: User!
        createdAt: String!
    }

    type Server {
        id: ID!
        name: String!
        owner: User!
        members: [User!]
        channels: [Channel!]
    }

    type Channel {
        id: ID!
        name: String!
        server: Server!
        messages: [ChannelMessage!]
        latestMessageTimestamp: DateTime
    }

    type ChannelMessage {
        id: ID!
        content: String!
        user: User!
        channel: Channel!
        createdAt: String!
    }
`

export default typeDefs