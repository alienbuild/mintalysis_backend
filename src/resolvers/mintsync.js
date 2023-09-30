const resolvers = {
    Query: {
        getUserServers: (_, { userId }, { prisma }) => {
            return prisma.server.findMany({ where: { members: { some: { userId } } } });
        },
        getServerChannels: (_, { serverId }, { prisma }) => {
            return prisma.channel.findMany({ where: { serverId } });
        },
    },
    Mutation: {
        createServer: (_, {name, ownerId}, {prisma}) => {
            return prisma.server.create({data: {name, ownerId, members: {connect: {userId: ownerId}}}});
        },
        createChannel: (_, {name, serverId}, {prisma}) => {
            return prisma.channel.create({data: {name, serverId}});
        },
        sendDirectMessage: (_, {content, senderId, receiverId}, {prisma}) => {
            return prisma.direct_message.create({data: {content, senderId, receiverId}});
        },
        sendChannelMessage: (_, {content, userId, channelId}, {prisma}) => {
            return prisma.channel_message.create({data: {content, userId, channelId}});
        },
    }
}

export default resolvers