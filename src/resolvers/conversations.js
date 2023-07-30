import {Prisma} from '@prisma/client'
import {withFilter} from "graphql-subscriptions"
import {GraphQLError} from "graphql"
import {userIsConversationParticipant} from "../utils/userIsConversationParticipant.js";

const resolvers = {
    Query: {
        conversations: async ( _, __, { userInfo, prisma }) => {
            if (!userInfo.sub) throw new GraphQLError('Not authorised.')

            const { userId } = userInfo

            try {

                return await prisma.conversation.findMany({
                    where: {
                        participants: {
                            some: {
                                user_id: {
                                    equals: userId
                                }
                            }
                        }
                    },
                    include: conversationPopulated
                })

            } catch (err) {
                console.log('error getitng conversations: ', err)
                throw new GraphQLError('Unable to get conversations')
            }

        },
        conversation: async (_, { conversationId }, { userInfo, prisma }) => {

            return await prisma.conversation.findUnique({
                where: {
                    id: conversationId
                },
                include: conversationPopulated
            })

        },
    },
    Mutation: {
        createConversation: async (_, { participantIds }, { userInfo, prisma, pubsub } ) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            const { userId } = userInfo
            try {
                const existingConversation = await prisma.conversation.findMany({
                    where: {
                        owner_id: userId,
                        participants: {
                            every: {
                                user_id: { in: participantIds },
                            }
                        }
                    }
                })

                if (existingConversation.length > 0) {
                    return {
                        conversationId: existingConversation[0].id
                    }
                } else {
                    const conversation = await prisma.conversation.create({
                        data: {
                            owner_id: userId,
                            participants: {
                                createMany: {
                                    data: participantIds.map(id => ({
                                        user_id: id,
                                        has_seen_latest_message: id === userId
                                    }))
                                }
                            }
                        },
                        include: conversationPopulated
                    })

                    pubsub.publish('CONVERSATION_CREATED', {
                        conversationCreated: conversation
                    })

                    return {
                        conversationId: conversation.id
                    }
                }

            } catch (err) {
                throw new GraphQLError('Error creating conversation.')
            }
        },
        deleteConversation: async (_, { conversationId }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Not authorised.')

            try {

                const [deletedConversation] = await prisma.$transaction([
                    prisma.conversation.delete({
                        where: {
                            id: conversationId
                        },
                        include: conversationPopulated
                    }),
                    prisma.conversation_participant.deleteMany({
                        where: {
                            id: conversationId
                        }
                    }),
                    prisma.message.deleteMany({
                        where: {
                            id: conversationId
                        }
                    })
                ])

                pubsub.publish('CONVERSATION_DELETED', {
                    conversationDeleted: deletedConversation
                })

            } catch (err) {
                throw new GraphQLError('Error deleting conversation.')
            }

            return true
        }
    },
    Subscription: {
        conversationCreated: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(['CONVERSATION_CREATED']),
                (payload, _, { userInfo }) => {
                    const { conversationCreated: { participants } } = payload

                    return userIsConversationParticipant(participants, userInfo?.userId)
                },
            )
        },
        conversationUpdated: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(['CONVERSATION_UPDATED']),
                (payload, _, { userInfo }) => {
                    if (!userInfo) throw new GraphQLError('Not authorised.')

                    return userIsConversationParticipant(payload.conversationUpdated.conversation.participants, userInfo?.userId)
            })
        },
        conversationDeleted: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(['CONVERSATION_DELETED']),
                (payload, _, { userInfo }) => {
                    if (!userInfo) throw new GraphQLError('Not authorised.')

                    return userIsConversationParticipant(payload.conversationDeleted.conversation.participants, userInfo?.userId)

                }
            )
        }
    }
}

export const participantPopulated = Prisma.validator()({
    user: {
        select: {
            id: true,
            username: true,
            last_seen: true,
            avatar: true
        }
    }
})

export const conversationPopulated = Prisma.validator()({
    participants: {
        include: participantPopulated
    },
    latest_message: {
        include: {
            sender: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    }
})

export default resolvers