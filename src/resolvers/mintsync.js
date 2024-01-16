import {decodeCursor, encodeCursor, slugify} from "../utils/index.js";
import * as cloudinary from "cloudinary";
import {moderateMessage, createRtcToken, createUniqueChannelName} from "../utils/mintsyncUtils.js";

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
        getServers: async (_, { search, pagingOptions}, { prisma, userInfo }) => {
            try {
                let limit = 5
                if (pagingOptions && pagingOptions.limit) limit = pagingOptions.limit

                const whereClause = userInfo?.sub
                    ? {
                        OR: [
                            { is_public: true },
                            {
                                members: {
                                    some: { id: userInfo.sub },
                                },
                            },
                        ],
                    }
                    : { is_public: true };

                let queryParams = { take: limit, orderBy: { id: 'asc' }, cacheStrategy: { swr: 60, ttl: 60 }, };
                let whereParams = { ...whereClause };
                if (pagingOptions?.after) queryParams = { ...queryParams, skip: 1, cursor: { id: Number(decodeCursor(pagingOptions.after)) }}
                if (search) whereParams = { ...whereParams, name: { contains: search, mode: 'insensitive' }}

                queryParams.where = whereParams;

                const servers = await prisma.server.findMany(queryParams)

                return {
                    edges: servers,
                    pageInfo: {
                        endCursor: servers.length > 1 ? encodeCursor(String(servers[servers.length - 1].id)) : null
                    }
                }
            } catch (error) {
                console.error('Error fetching servers:', error);
                throw new Error('Unable to fetch servers');
            }
        },
        getServer: async (_, { slug }, { prisma, userInfo }) => {
            try {
                return await prisma.server.findUnique({
                    where: { slug }
                })
            } catch (error) {
                console.error('Error fetching server:', error);
                throw new Error('Unable to fetch servers');
            }
        },
        getServerChannels: async (_, { type, serverId }, { prisma }) => {
            try {
                const channels = await prisma.server.findUnique({
                    where: { id: parseInt(serverId) },
                }).channels({
                    where: { type },
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
                    latestMessageTimestamp: channel.messages[0]?.createdAt || null
                }));
            } catch (error) {
                console.error('Error fetching server channels:', error);
                throw new Error('Unable to fetch server channels');
            }
        },
        getServerMembers: async (_, { serverId, limit = 50}, { prisma }) => {
            try {
                return prisma.server.findUnique({
                    where: {
                        id: Number(serverId)
                    },
                    select: {
                        id: true,
                        ownerId: true,
                        owner: {
                            select:{
                                id: true
                            }
                        },
                        members: {
                            take: limit,
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                                status: true,
                                UserToRoles: {
                                    select: {
                                        role: {
                                            select: {
                                                id: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            },
                        },
                    },
                });
            } catch (error) {
                console.error('Error fetching channel members:', error);
                throw new Error('Unable to fetch channel members');
            }
        },
        getAllServerMembers: async (_, { serverId, limit = 50, offset = 0 }, { prisma }) => {
            try {
                const serverExists = await prisma.server.findUnique({
                    where: { slug: serverId },
                    select: { id: true }
                });

                if (!serverExists) throw new Error('Server not found');

                const [usersInServer, totalCount] = await prisma.$transaction([
                    prisma.User.findMany({
                        where: {
                            servers: {
                                some: {
                                    slug: serverId
                                }
                            }
                        },
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            status: true,
                            UserToRoles: {
                                select: {
                                    role: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        take: limit,
                        skip: offset,
                    }),
                    prisma.user.count({
                        where: {
                            servers: {
                                some: {
                                    slug: serverId
                                }
                            }
                        }
                    })
                ]);

                if (!usersInServer.length) throw new Error('No members found for this server');

                return {
                    members: usersInServer,
                    totalCount
                };

            } catch (error) {
                console.error('Error fetching server members:', error);
                throw new Error('Unable to fetch server members');
            }
        },
        getOnlineServerMembers: async (_, { serverId }, { prisma }) => {
            const server = await prisma.server.findUnique({where: {slug: serverId}});
            const realServerId = server.id;

            const members = await prisma.User.findMany({
                where: {
                    servers: {
                        some: {id: realServerId},
                    },
                    status: 'ONLINE',
                },
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                    status: true,
                    UserToRoles: {
                        where: {
                            role: {
                                serverId: realServerId,
                            }
                        },
                        select: {
                            role: {
                                select: {
                                    id: true,
                                    name: true,
                                    serverId: true
                                }
                            }
                        }
                    }
                }
            });
            return members;
        },
        getChannelMessages: async (_, { channelId, limit = 10, cursor }, { prisma }) => {
            try {
                const where = {
                    channel_id: Number(channelId),
                    ...(cursor && { id: { lt: Number(cursor) } }),
                };

                return await prisma.channel_message.findMany({
                    where,
                    take: limit,
                    orderBy: { id: 'desc' },
                    include: {
                        user: true,
                        partOfThread: true,
                        createdThread: true
                    }
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
        userRoles: async (_, { userId }, context) => {
            const rolesData = await context.prisma.userToRoles.findMany({
                where: { userId },
                include: { role: true }
            });

            return rolesData.map(item => item.role);
        },
        userBadges: async (_, { userId }, context) => {
            const badgeData = await context.prisma.user_badges.findMany({
                where: { userId },
                include: { badge: true }
            });

            return badgeData.map(item => item.badge);
        }
    },
    Mutation: {
        createServer: async (_, { name, ownerId, description, icon }, { prisma }) => {
            try {
                let imageUrl = null;

                const imageExists = await icon.file;
                if (imageExists) {
                    try {
                        const result = await new Promise((resolve, reject) => {
                            imageExists.createReadStream().pipe(
                                cloudinary.v2.uploader.upload_stream(
                                    {
                                        transformation: [
                                            { width: 250, height: 250, crop: "fill", gravity: "face" }
                                        ]
                                    },
                                    (error, result) => {
                                        if (error) reject(error);
                                        resolve(result);
                                    }
                                )
                            );
                        });
                        imageUrl = result.secure_url;
                    } catch (error) {
                        console.error('Error uploading image to Cloudinary:', error);
                        throw new Error('Unable to upload image');
                    }
                }

                const createdServer = await prisma.server.create({
                    data: {
                        name,
                        ownerId,
                        description,
                        slug: slugify(name),
                        icon: imageUrl,
                        members: {
                            connect: { id: ownerId }
                        }
                    }
                });

                // Create an 'Admin' role for this server
                const adminRole = await prisma.role.create({
                    data: {
                        name: 'Admin',
                        description: 'Administrator role with full permissions',
                        serverId: createdServer.id,
                    },
                });

                // Assign the 'Admin' role to the user (owner)
                await prisma.userToRoles.create({
                    data: {
                        userId: ownerId,
                        roleId: adminRole.id,
                    },
                });

                // Create a 'Moderator' role for this server
                const moderatorRole = await prisma.role.create({
                    data: {
                        name: 'Moderator',
                        description: 'Moderator role with moderate permissions',
                        serverId: createdServer.id,
                    },
                });

                return createdServer;

            } catch (error) {
                console.error('Error creating server:', error);
                throw new Error('Unable to create server');
            }
        },
        createChannel: async (_, { name, serverId }, { prisma }) => {
            console.log('create server id is: ', serverId)
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
        deleteChannel: async (_, { channelId }, { prisma, userInfo }) => {
            // Check role of user before action
            // If not admin/mod throw error

            return await prisma.channel.delete({
                where: {id: channelId},
            });
        },
        renameChannel: async (_, { channelId, newName }, { prisma, userInfo }) => {
            // Check role of user before action
            // if not admin/mod throw error

            return await prisma.channel.update({
                where: {id: channelId},
                data: {
                    name: newName
                },
            });
        },
        updateChannelTopic: async (_, { channelId, newTopic }, { prisma, userInfo }) => {
            // Check role of user before action
            // If not admin/mod throw error

            return await prisma.channel.update({
                where: {id: channelId},
                data: {topic: newTopic},
            });
        },
        setSlowMode: async (_, { channelId, newSlowModeDelay }, { prisma, userInfo }) => {
            // Check role of user before action
            // If not admin/mod throw error

            return await prisma.channel.update({
                where: {id: channelId},
                data: {slowModeDelay: newSlowModeDelay},
            });
        },
        sendChannelMessage: async (_, { content, type, userId, channelId, serverId }, { prisma, pubsub, userInfo }) => {
            try {

                const toxicity = await moderateMessage(content);

                if (toxicity > 0.8) {
                    throw new Error('This message contains harmful language.');
                }

                const channel = await prisma.channel.findUnique({
                    where: { id: channelId },
                });

                const slowModeDelay = channel.slowModeDelay;

                // Fetch user's roles on the server
                const requesterRoles = await prisma.userToRoles.findMany({
                    where: {
                        userId: userInfo.sub,
                        role: {
                            serverId: parseInt(serverId),
                        }
                    },
                    include: {
                        role: true
                    }
                });

                // Check if user is a moderator or admin
                const isModOrAdmin = requesterRoles.some(userToRole => ["Admin", "Moderator"].includes(userToRole.role.name));

                if (slowModeDelay && !isModOrAdmin) {
                    const lastMessage = await prisma.channel_message.findFirst({
                        where: {
                            userId: userInfo.sub,
                            channelId,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    });

                    if (lastMessage) {
                        const timeElapsed = new Date() - new Date(lastMessage.createdAt);

                        if (timeElapsed < slowModeDelay * 1000) {
                            throw new Error('Slow mode is enabled. Please wait before sending another message.');
                        }
                    }
                }

                const mute = await prisma.mute.findFirst({
                    where: {
                        userId: userInfo.sub,
                        AND: [
                            { channel: { id: channelId } },
                            { server: { slug: serverId } },
                        ]
                    }
                });

                if (mute) {
                    const muteEnd = mute.muteEnd;

                    if (!muteEnd || new Date() < new Date(muteEnd)) {
                        throw new Error('Sorry, you are muted and cannot perform this action.');
                    }
                }

                const message = await prisma.channel_message.create({
                    data: {
                        content,
                        type,
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
                    include: { user: true }
                });

                pubsub.publish(`MESSAGE_SENT_${channelId}`, { mintSyncMessageSent: message });

                return message;
            } catch (error) {
                console.error('Error sending channel message:', error);
                throw new Error('Unable to send channel message');
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
        createReply: async (_, { threadId, content, channelId, serverId }, { prisma, pubsub, userInfo }) => {
            try {
                const mute = await prisma.mute.findFirst({
                    where: {
                        userId: userInfo.sub,
                        AND: [
                            { channel: { id: channelId } },
                            { server: { slug: serverId } },
                        ]
                    }
                });

                if (mute) {
                    const muteEnd = mute.muteEnd;

                    if (!muteEnd || new Date() < new Date(muteEnd)) {
                        throw new Error('Sorry, you are muted and cannot perform this action.');
                    }
                }

                const newReply = await prisma.channel_message.create({
                    data: {
                        content,
                        partOfThreadId: threadId,
                    },
                });

                pubsub.publish('NEW_REPLY_IN_THREAD', { newReplyInThread: newReply, threadId });

                return newReply;
            } catch (error) {
                console.error('Error creating reply message:', error);
                throw new Error('Unable to send channel message');
            }
        },
        assignRole: async (_, { userId, roleId, serverId }, context) => {
            const params = {
                userId,
                roleId,
                serverId,
            };
            const existingRole = await context.prisma.userToRoles.create({
                data: params,
                include: { role: true },
            });
            return existingRole.role;
        },
        assignBadge: async (_, { userId, badgeId }, context) => {
            const params = { userId, badgeId }
            const assignedBadge = await context.prisma.user_badges.create({
                data: params,
                include: { badge: true },
            });
            return assignedBadge.badge;
        },
        assignModeratorRole: async (parent, { userId, serverId }, { prisma, userInfo }) => {
            // Check if the requesting user is an Admin of the server
            const requesterId = userInfo.sub
            const isAdmin = await prisma.userToRoles.findMany({
                where: {
                    AND: [
                        {
                            role: {
                                name: 'Admin',
                                serverId: parseInt(serverId),
                            }
                        },
                        {
                            userId: requesterId
                        }
                    ]
                }
            });

            if (!isAdmin) throw new Error('Requesting user is not an Admin of the server');

            // Check if the user is a member of the server
            const isMember = await prisma.server.findFirst({
                where: {
                    id: parseInt(serverId),
                    members: {
                        some: {
                            id: userId
                        }
                    }
                }
            });

            if (!isMember) throw new Error('The user is not a member of the server');

            // Check if user already has Moderator role
            const isModerator = await prisma.userToRoles.findFirst({
                where: {
                    AND: [
                        {
                            role: {
                                name: 'Moderator',
                                serverId: parseInt(serverId),
                            }
                        },
                        {
                            userId: userId
                        }
                    ]
                }
            });

            if (isModerator) throw new Error('User is already a moderator');

            // Assign Moderator role to user
            const role = await prisma.role.findFirst({
                where: {
                    AND: [
                        {
                            name: 'Moderator',
                        },
                        {
                            serverId: parseInt(serverId),
                        }
                    ]
                }
            });

            if (!role) throw new Error('Moderator role does not exist');


            await prisma.userToRoles.create({
                data: {
                    userId: userId,
                    roleId: role.id,
                },
            });

            return role;
        },
        removeModeratorRole: async (parent, { userId, serverId }, { prisma, userInfo }) => {
            const requesterId = userInfo.sub

            // Check if requester is Admin of the server
            const requesterIsAdmin = await prisma.userToRoles.findFirst({
                where: {
                    userId: requesterId,
                    role: {
                        name: 'Admin',
                        serverId: parseInt(serverId),
                    },
                },
            });

            if (!requesterIsAdmin) {
                throw new Error('You must be an Admin to remove a Moderator');
            }

            // Check if the user to remove Moderator role from is a member of the server
            const userIsMember = await prisma.user.findFirst({
                where: {
                    id: userId,
                    memberOf: {
                        some: {
                            id: parseInt(serverId),
                        }
                    },
                },
            });

            if (!userIsMember) {
                throw new Error('User is not a member of the server');
            }

            // Find and delete the Moderator role from the user
            const moderatorRole = await prisma.userToRoles.deleteMany({
                where: {
                    userId: userId,
                    role: {
                        name: 'Moderator',
                        serverId: parseInt(serverId),
                    },
                },
            });

            // Boolean indicating whether the deletion was successful
            return moderatorRole.count > 0;
        },
        muteUser: async (_, { userId, serverId, channelId, muteDuration }, { prisma, userInfo }) => {

            const requesterRoles = await prisma.userToRoles.findMany({
                where: {
                    userId: userInfo.sub,
                    role: {
                        serverId: parseInt(serverId),
                    }
                },
                include: {
                    role: true
                }
            });

            const permitted = requesterRoles.some(userToRole => ["Admin", "Moderator"].includes(userToRole.role.name));

            if (!permitted) throw new Error('You must be an Admin or a Moderator to mute a user');

            const muteEnd = muteDuration === Number.MAX_VALUE ? null : new Date();
            if (muteEnd) {
                muteEnd.setSeconds(muteEnd.getSeconds() + muteDuration);
            }

            const mute = await prisma.mute.create({
                data: {
                    userId,
                    serverId,
                    channelId: channelId || null,
                    muteEnd: muteEnd ? muteEnd.toISOString() : null,
                },
            });

            return mute;
        },
        startCall: async (_, { serverId, channelId }, { prisma, userInfo }) => {

            const channelName = createUniqueChannelName(serverId, channelId);
            const token = createRtcToken(channelName, userInfo.sub)

            return { channelName, token }
        },
        createAudioChannel: async (_, { name, serverId }, { prisma }) => {
            try {
                return await prisma.channel.create({
                    data: {
                        name,
                        server: {
                            connect: {
                                id: parseInt(serverId)
                            }
                        },
                        type: 'AUDIO'
                    }
                });
            } catch (error) {
                console.error('Error creating audio channel:', error);
                throw new Error('Unable to create audio channel');
            }
        },
        joinAudioChannel: async (_, { serverId, channelId }, { prisma, pubsub, userInfo }) => {
            const channelName = createUniqueChannelName(serverId, channelId);
            const uid = userInfo.sub;
            const token = createRtcToken(channelName, uid);

            // Publish event when a user joins an audio channel
            pubsub.publish(`USER_JOINED_AUDIO_CHANNEL_${channelName}`, {
                userJoinedAudioChannel: {
                    channelId,
                    userId: userInfo.sub,
                    event: "JOINED"
                }
            });

            return { channelName, token, uid };
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
        userJoinedAudioChannel: {
            subscribe: (_, { channelId }, { pubsub }) =>
                pubsub.asyncIterator([`USER_JOINED_AUDIO_CHANNEL_${channelId}`]),
        },
        userLeftAudioChannel: {
            subscribe: (_, { channelId }, { pubsub }) =>
                pubsub.asyncIterator([`USER_LEFT_AUDIO_CHANNEL_${channelId}`]),
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
    User: {
        // roles: async (parent, args, { prisma }) => {
        //     console.log('prisma is: ', prisma)
        //     try {
        //         const { serverId } = args
        //         console.log('server id: ', serverId)
        //         console.log('userId: ', parent.id)
        //         const userRoles = await prisma.userToRoles.findMany({
        //             where: {
        //                 userId: parent.id,
        //                 server_member: {
        //                     every: {
        //                         serverId: parseInt(serverId)
        //                     }
        //                 }
        //             },
        //             include: {
        //                 role: true
        //             }
        //         })
        //
        //         return userRoles.map(userRole => userRole.role)
        //     } catch (e) {
        //         throw new GraphQLError('Error')
        //     }
        // },
        badges: async (parent, args, { prisma }) => {
            const badges_data = await prisma.user_badges.findMany({
                where: { userId: parent.id },
                include: { badge: true }
            });
            return badges_data.map((u2b) => u2b.badge);
        },
    },
}

export default resolvers