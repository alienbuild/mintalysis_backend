import {ApolloError} from "apollo-server-express";
import { Prisma } from '@prisma/client'

const resolvers = {
    Query: {
        searchConversations: () => {}
    },
    Mutation: {
        createConversation: async (_, { participantIds }, { userInfo, prisma } ) => {
            console.log('Inside create conversation: ', participantIds)
            if (!userInfo) throw new ApolloError('Not authorised')

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

                return {
                    conversationId: conversation.id
                }

            } catch (err) {
                console.log('Create conversation error: ', err)
                throw new ApolloError('Error creating conversation.')
            }
        }
    },
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