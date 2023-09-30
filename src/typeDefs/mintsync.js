import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getUserServers(userId: ID!): [Server!]
        getServerChannels(serverId: ID!): [Channel!]
    }

    type Mutation {
        createServer(name: String!, ownerId: ID!): Server!
        createChannel(name: String!, serverId: ID!): Channel!
        sendDirectMessage(content: String!, senderId: ID!, receiverId: ID!): DirectMessage!
        sendChannelMessage(content: String!, userId: ID!, channelId: ID!): ChannelMessage!
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