import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getUserServers(userId: ID!): [Server!]
        getServers(pagingOptions: pagingOptions, search: String): ServerConnection!
        getServerChannels(type: String, serverId: ID!): [Channel!]
        getServerMembers(serverId: ID!): Server
        getAllServerMembers(serverId: ID!, limit: Int, offset: Int): ServerMembersConnection!
        getOnlineServerMembers(serverId: ID!): [User!]!
        getChannelMessages(channelId: ID!, limit: Int, cursor: ID): [ChannelMessage!]
        getChannel(channelId: ID!): Channel
        getThread(id: ID!): [Thread!]!
        userRoles(userId: String!): [Role!]!
        userBadges(userId: String!): [Badge!]!
    }

    type Mutation {
        createServer(name: String!, ownerId: ID!, description: String, icon: Upload): Server!
        createChannel(name: String!, serverId: ID!): Channel!
        deleteChannel(channelId: ID!): Channel!
        renameChannel(channelId: ID!, newName: String!): Channel!
        updateChannelTopic(channelId: ID!, newTopic: String!): Channel!
        setSlowMode(channelId: ID!, newSlowModeDelay: Int!): Channel!
        sendChannelMessage(content: String!, type: MessageType! userId: ID!, channelId: ID! serverId: ID): ChannelMessage!
        updateLastRead(userId: ID!, channelId: ID!): LastReadUpdateResponse!
        createThread(startingMessageId: ID!, channelId: ID!, content: String!): Thread!
        createReply(threadId: Int!, content: String!, channelId: ID, serverId: ID): ChannelMessage!
#        postToThread(threadId: ID!, content: String!): MessageThread!
        assignRole(userId: String!, roleId: Int!): Role!
        assignBadge(userId: String!, badgeId: Int!): Badge!
        assignModeratorRole(userId: ID!, serverId: ID!): Role
        removeModeratorRole(userId: ID!, serverId: ID!): Boolean
        muteUser(userId: ID!, serverId: ID!, channelId: ID, muteDuration: Int!): Mute!
        startCall(serverId: ID!, channelId: ID!): StartCallResponse
        createAudioChannel(name: String!, serverId: ID!): Channel!
        joinAudioChannel(channelId: ID!, serverId: ID!): JoinAudioChannelResponse!
    }

    type Subscription {
        mintSyncMessageSent(channelId: ID!): ChannelMessage!
        directMessageSent(receiverId: ID!): DirectMessage!
        lastReadUpdated(userId: ID!): LastReadUpdate!
        newReplyInThread(threadId: Int!): ChannelMessage! 
    }

    type JoinAudioChannelResponse {
        channelName: String!
        token: String!
        uid: ID!
    }
    
    type StartCallResponse {
        channelName: String!
        token: String!
    }
    
    type ServerMembersConnection {
        members: [User]!
        totalCount: Int!
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

    type ServerConnection {
        edges: [Server]
        pageInfo: PageInfo
    }

    type Server {
        id: ID!
        name: String!
        slug: String
        icon: String
        description: String
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
        channelType: ChannelType
    }

    type ChannelMessage {
        id: ID!
        content: String!
        type: MessageType!
        user: User!
        channel: Channel!
        createdAt: String!
        partOfThread: Thread
        createdThread: Thread
    }

    type Thread {
        id: ID!
        startingMessage: ChannelMessage!
        messages: [ChannelMessage!]!
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

    extend type User {
        UserToRoles: [UserToRole!]!
        badges: [Badge!]!
    }

    type Role {
        id: ID!
        name: String
        description: String
        server: Server!
    }
    
    type UserToRole {
#        id: ID!
        role: Role!
#        serverRole(serverId: ID!): Role
    }

    type Badge {
        id: ID!
        name: String!
        description: String
    }

    type Mute {
        id: ID!
        user: User!
        server: Server!
        channel: Channel
        muteEnd: String!
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

    enum ChannelType {
        TEXT
        AUDIO
        VIDEO
    }

`

export default typeDefs