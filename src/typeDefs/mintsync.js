import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getUserServers(userId: ID!): [Server!]
        getServers: [Server!]!
        getServerChannels(serverId: ID!): [Channel!]
        getServerMembers(serverId: ID!): Server
        getChannelMessages(channelId: ID!, limit: Int, cursor: ID): [ChannelMessage!]
        getChannel(channelId: ID!): Channel
        getThreads(messageId: ID!): [Thread!]!
    }

    type Mutation {
        createServer(name: String!, ownerId: ID!): Server!
        createChannel(name: String!, serverId: ID!): Channel!
        sendDirectMessage(content: String!, senderId: ID!, receiverId: ID!): DirectMessage!
        sendChannelMessage(content: String!, type: MessageType! userId: ID!, channelId: ID!): ChannelMessage!
        updateLastRead(userId: ID!, channelId: ID!): LastReadUpdateResponse!
        createThread(messageId: ID!, content: String!): Thread!
        postToThread(threadId: ID!, content: String!): MessageThread!
        createReply(threadId: Int!, content: String!): ChannelMessage!
    }

    type Subscription {
        mintSyncMessageSent(channelId: ID!): ChannelMessage!
        directMessageSent(receiverId: ID!): DirectMessage!
        lastReadUpdated(userId: ID!): LastReadUpdate!
        newReplyInThread(threadId: Int!): ChannelMessage!
    }
    
    type LastReadUpdateResponse {
        success: Boolean!
        message: String
        lastRead: DateTime
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
        type: MessageType!
        user: User!
        channel: Channel!
        createdAt: String!
    }

    type Thread {
        id: ID!
        startingMessage: Message!
        messages: [Message!]!
        createdAt: String!
        updatedAt: String!
    }

    type MessageThread {
        id: ID!
        content: String!
        user: User!
        createdAt: String!
        updatedAt: String!
    }

    extend type Message {
        createdThread: Thread
        partOfThread: Thread
    }

    enum MessageType {
        TEXT
        EMOJI
        GIF
    }

`

export default typeDefs