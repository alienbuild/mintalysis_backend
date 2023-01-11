import {Prisma} from '@prisma/client'
import {withFilter} from "graphql-subscriptions"
import {GraphQLError} from "graphql"

const resolvers = {
    Query: {
        conversations: async ( _, __, { userInfo, prisma }) => {
            if (!userInfo.userId) throw new GraphQLError('Not authorised.')

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
                throw new GraphQLError('Unable to get conversations')
            }

        }
    },
    Mutation: {
        createConversation: async (_, { participantIds }, { userInfo, prisma, pubsub } ) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            const { userId } = userInfo

            try {
                const conversation = await prisma.conversation.create({
                    data: {
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

            } catch (err) {
                throw new GraphQLError('Error creating conversation.')
            }
        }
    },
    Subscription: {
        conversationCreated: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(['CONVERSATION_CREATED']),
                (payload, _, { userInfo }) => {
                    const { conversationCreated: { participants } } = payload
                    return !!participants.find(p => p.user_id === userInfo?.userId)
                },
            )
        }
    }
}

export const participantPopulated = Prisma.validator()({
    user: {
        select: {
            id: true,
            username: true
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