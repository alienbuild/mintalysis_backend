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
        getServerMembers: async (_, { serverId }, { prisma }) => {
            try {
                return prisma.server.findUnique({
                    where: { id: Number(serverId) },
                    include: { members: true },
                });
            } catch (error) {
                console.error('Error fetching channel members:', error);
                throw new Error('Unable to fetch channel members');
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
        getChannel: async (_, { channelId }, { prisma }) => {
            try {
                const channel = await prisma.channel.findUnique({ where: { id: Number(channelId) } });
                if (!channel) throw new Error('Channel not found');
                return channel;
            } catch (error) {
                console.error('Error fetching channel:', error);
                throw new Error('Unable to fetch channel');
            }
        },
        getThread: async (_, { id }, { prisma }) => {
            try {
                return prisma.thread.findUnique({ where: { id: +id } });
            } catch (error) {
                console.log('Unable to get thread: ', error)
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
        sendChannelMessage: async (_, { content, type, userId, channelId }, { prisma, pubsub }) => {
            try {
                const message = await prisma.channel_message.create({
                    data: {
                        content,
                        type,
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
        updateLastRead: async (_, { userId, channelId }, { prisma, pubsub }) => {
            const receipt = await prisma.channel_read_receipt.upsert({
                where: { userId_channelId: { userId, channelId: Number(channelId) } },
                update: { lastRead: new Date() },
                create: { userId, channelId: Number(channelId), lastRead: new Date() }
            });

            pubsub.publish('LAST_READ_UPDATED', {
                lastReadUpdated: { userId, channelId, lastRead: new Date() }
            });

            return receipt;
        },
        createThread: async (_, { startingMessageId, channelId, content }, { prisma, userInfo }) => {
            try {
                const createdMessage = await prisma.$transaction([
                    prisma.channel_message.create({
                        data: {
                            content,
                            partOfThread: {
                                create: {
                                    startingMessageId: Number(startingMessageId),
                                }
                            },
                            user: {
                                connect: {
                                    id: userInfo.sub,
                                },
                            },
                            channel: {
                                connect: {
                                    id: Number(channelId),
                                },
                            },
                        },
                        include: {
                            partOfThread: true
                        }
                    })
                ]);
                return createdMessage[0];
            } catch (error) {
                console.log('ERROR CREATING THREAD: ', error);
                throw new Error('Error creating thread');
            }
        },
        createReply: async (_, { threadId, content }, { prisma, pubsub }) => {
            const newReply = await prisma.channel_message.create({
                data: {
                    content,
                    partOfThreadId: threadId,
                },
            });

            pubsub.publish('NEW_REPLY_IN_THREAD', { newReplyInThread: newReply, threadId });

            return newReply;
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
        lastReadUpdated: {
            subscribe: (_, { LAST_READ_UPDATED }, { pubsub }) => pubsub.asyncIterator([LAST_READ_UPDATED])
        },
        newReplyInThread: {
            subscribe: (_, { threadId }, { pubsub }) => {
                return pubsub.asyncIterator(['NEW_REPLY_IN_THREAD' + threadId]);
            },
            resolve: (payload) => {
                return payload.newReplyInThread;
            },
        },
    },
    Server: {
        members: async (server, _, ___) => {
            return server.members || [];
        },
    },
    Thread: {
        startingMessage: async ({ id }, _, { prisma }) => {
            return prisma.channel_message.findUnique({ where: { id } });
        },
        messages: async ({ id }, _, { prisma }) => {
            return prisma.channel_message.findMany({ where: { partOfThreadId: id } });
        },
    },
    Message: {
        createdThread: async ({ id }, _, { prisma }) => {
            return prisma.thread.findUnique({ where: { startingMessageId: id } });
        },
        partOfThread: async ({ partOfThreadId }, _, { prisma }) => {
            return prisma.thread.findUnique({ where: { id: partOfThreadId } });
        },
    },
}

export default resolvers