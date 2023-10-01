const resolvers = {
    Query: {
        getUserServers: async (_, { userId }, { prisma }) => {
            try {
                return await prisma.server.findMany({ where: { members: { some: { userId } } } });
            } catch (error) {
                console.error('Error fetching user servers:', error);
                throw new Error('Unable to fetch user servers');
            }
        },
        getServers: async (_, __, { prisma }) => {
            try {
                return await prisma.server.findMany();
            } catch (error) {
                console.error('Error fetching servers:', error);
                throw new Error('Unable to fetch servers');
            }
        },
        getServerChannels: async (_, { serverId }, { prisma }) => {
            try {
                const channels = await prisma.channel.findMany({
                    where: { server_id: Number(serverId) },
                    include: {
                        messages: {
                            take: 1,
                            orderBy: {
                                createdAt: 'desc'
                            },
                            select: {
                                createdAt: true,
                            }
                        }
                    }
                });

                return channels.map(channel => ({
                    ...channel,
                    latestMessageTimestamp: channel.messages[0]?.createdAt
                }));
            } catch (error) {
                console.error('Error fetching server channels:', error);
                throw new Error('Unable to fetch server channels');
            }
        },
        getChannelMessages: async (_, { channelId, limit = 10, cursor }, { prisma }) => {
            console.log('channelId is: ', channelId)
            try {
                const where = {
                    channel_id: Number(channelId),
                    ...(cursor && { id: { lt: Number(cursor) } }),
                };

                return await prisma.channel_message.findMany({
                    where,
                    take: limit,
                    orderBy: { id: 'desc' },
                    include: { user: true }
                });
            } catch (error) {
                console.error('Error fetching channel messages:', error);
                throw new Error('Unable to fetch channel messages');
            }
        },
    },
    Mutation: {
        createServer: async (_, {name, ownerId}, {prisma}) => {
            try {
                return await prisma.server.create({
                    data: {
                        name,
                        ownerId,
                        members: {
                            connect: { id: ownerId }
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating server:', error);
                throw new Error('Unable to create server');
            }
        },
        createChannel: async (_, { name, serverId }, { prisma }) => {
            try {
                return await prisma.channel.create({
                    data: {
                        name,
                        server: {
                            connect: {
                                id: parseInt(serverId)
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating channel:', error);
                throw new Error('Unable to create channel');
            }
        },
        sendChannelMessage: async (_, { content, userId, channelId }, { prisma, pubsub }) => {
            try {
                const message = await prisma.channel_message.create({
                    data: {
                        content,
                        user: {
                            connect: {
                                id: userId,
                            },
                        },
                        channel: {
                            connect: {
                                id: Number(channelId),
                            },
                        },
                    },
                    include: { user: true }
                });

                pubsub.publish(`MESSAGE_SENT_${channelId}`, { mintSyncMessageSent: message });

                return message;
            } catch (error) {
                console.error('Error sending channel message:', error);
                throw new Error('Unable to send channel message');
            }
        },
        sendDirectMessage: async (_, { content, senderId, receiverId }, { prisma, pubsub }) => {
            try {
                const message = await prisma.direct_message.create({ data: { content, senderId, receiverId } });
                pubsub.publish(`DIRECT_MESSAGE_SENT_${receiverId}`, { directMessageSent: message });
                return message;
            } catch (error) {
                console.error('Error sending direct message:', error);
                throw new Error('Unable to send direct message');
            }
        },
        updateLastRead: async (_, { userId, channelId }, { prisma }) => {
            const receipt = await prisma.channelReadReceipt.upsert({
                where: { userId_channelId: { userId, channelId } },
                update: { lastRead: new Date() },
                create: { userId, channelId, lastRead: new Date() }
            });
            return receipt.lastRead;
        },

    },
    Subscription: {
        mintSyncMessageSent: {
            subscribe: (_, { channelId }, { pubsub }) =>
                pubsub.asyncIterator([`MESSAGE_SENT_${channelId}`]),
        },
        directMessageSent: {
            subscribe: (_, { receiverId }, { pubsub }) =>
                pubsub.asyncIterator([`DIRECT_MESSAGE_SENT_${receiverId}`]),
        },
    },
}

export default resolvers