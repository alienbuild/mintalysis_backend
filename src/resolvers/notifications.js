import {withFilter} from "graphql-subscriptions";
import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        getNotifications: async (_, __, { userInfo, prisma }) => {

            try {
                return await prisma.notifications.findMany({
                    where: {
                        to_user_id: userInfo.userId
                    },
                    take: 20
                })

            } catch (e) {
                throw new GraphQLError('Unable to fetch notifications')
            }

        },
    },
    Mutation: {
        // TEST MUTATION - DELETE AT PRODUCTION
        createNotification: async (_, __, { userInfo, prisma }) => {
            const test = await prisma.notifications.create({
                data: {
                    type: 'MARKETPLACE_OFFER',
                    content: 'This is a test notification',
                    reference: '123',
                    to_user_id: userInfo.userId
                }
            })
            console.log('notification created: ', test)

            // Create subscription event

            return true
        }
    },
    Subscription: {
        notification: {
            subscribe: withFilter((_, __, { pubsub }) => {
                return pubsub.asyncIterator(['NEW_NOTIFICATION'])
            }, (payload, { notificationId }, _) => {
                return payload.newNotification.notificationId === notificationId
            })
        }
    }
}

export default resolvers