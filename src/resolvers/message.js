import {GraphQLError} from "graphql";
import {Prisma} from "@prisma/client";
import {withFilter} from "graphql-subscriptions";
import {userIsConversationParticipant} from "../utils/userIsConversationParticipant.js";
import {conversationPopulated} from "./conversations.js";

const resolvers = {
    Query: {
        messages: async (_, {conversationId}, { userInfo, prisma } ) => {

            if (!userInfo) throw new GraphQLError('Not authorised.')

            const { userId } = userInfo

            const conversation = await prisma.conversation.findUnique({
                where: {
                    id: conversationId
                },
                include: conversationPopulated
            })

            if (!conversation) throw new GraphQLError('Conversation does not exist.')

            const allowedToView = userIsConversationParticipant(conversation.participants, userId)

            if (!allowedToView) throw new GraphQLError('Not authorised.')

            try {

                return await prisma.message.findMany({
                    where: {
                        conversationId
                    },
                    include: messagePopulated,
                    orderBy: {
                        createdAt: "desc"
                    }
                })

            } catch (err) {
                console.log('Messages error: ', err)
                throw new GraphQLError('Error fetching messages.')
            }

        }
    },
    Mutation: {
        sendMessage: async (_, { id, senderId, conversationId, body }, { userInfo, prisma, pubsub }) => {

            const { userId } = userInfo

            if (!userInfo) throw new GraphQLError('Not authorised.')
            if (userId !== senderId) throw new GraphQLError('Not authorised.')

            try {
                const newMessage = await prisma.message.create({
                    data: {
                        id,
                        senderId,
                        conversationId,
                        body
                    },
                    include: messagePopulated
                })

                const participant = await prisma.conversation_participant.findFirst({
                    where: {
                        user_id: userId,
                        conversation_id: conversationId
                    }
                })

                const conversation = await prisma.conversation.update({
                    where: {
                        id: conversationId
                    },
                    data: {
                        latest_message_id: newMessage.id,
                        participants: {
                            update: {
                                where: {
                                    id: participant.id
                                },
                                data: {
                                    has_seen_latest_message: true
                                }
                            },
                            updateMany: {
                                where: {
                                    NOT: {
                                        user_id: userInfo.id
                                    }
                                },
                                data: {
                                    has_seen_latest_message: false
                                }
                            }
                        }
                    },
                    include: conversationPopulated
                })

                pubsub.publish('MESSAGE_SENT', { messageSent: newMessage })
                pubsub.publish('CONVERSATION_UPDATED', { conversationUpdated: { conversation } })

            } catch (err) {
                console.log('Error sending message mutation: ', err)
                throw new GraphQLError('Error sending message.')
            }

            return true

        },
        markConversationAsRead: async (_, { userId, conversationId }, { userInfo, prisma }) => {

            if (!userInfo) throw new GraphQLError('Not authorised.')

            try {

                const participant = await prisma.conversation_participant.findFirst({
                    where: {
                        user_id: userId,
                        conversation_id: conversationId
                    }
                })

                if (!participant) throw new GraphQLError('Participant not found')

                await prisma.conversation_participant.update({
                    where: {
                        id: participant.id
                    },
                    data: {
                        has_seen_latest_message: true
                    }
                })

                return true

            } catch (err) {
                console.log('Mark convo as read error: ', err)
                throw new GraphQLError('Mark conversation read error')
            }

        }
    },
    Subscription: {
        messageSent: {
            subscribe: withFilter((_, __, { pubsub }) => {
                return pubsub.asyncIterator(['MESSAGE_SENT'])
            }, (payload, {conversationId}, _) => {
                return payload.messageSent.conversationId === conversationId
            })
        },
    }
}

export const messagePopulated = Prisma.validator()({
    sender: {
        select: {
            id: true,
            username: true
        }
    }
})

export default resolvers