import {withFilter} from "graphql-subscriptions";
import {GraphQLError} from "graphql";
import {encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        getNotifications: async (_, { filterOptions, pagingOptions, sortOptions }, { userInfo, prisma }) => {

            if (!userInfo.userId) throw new GraphQLError('Unauthorised.')

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit
            if (limit > 100) return null

            let queryParams = { take: limit }
            let whereParams = { to_user_id: userInfo.userId }

            if (filterOptions && filterOptions.type) whereParams = {...whereParams, type: filterOptions.type}
            if (filterOptions && filterOptions.category) whereParams = {...whereParams, category: filterOptions.category}

            queryParams = { ...queryParams, where: { ...whereParams }, include: { project: true } }

            try {
                const notifications = await prisma.notifications.findMany(queryParams)
                console.log('notifications are: ', notifications)

                return {
                    edges: notifications,
                    pageInfo: {
                        endCursor: notifications.length > 1 ? encodeCursor(notifications[notifications.length - 1].id) : null
                    }
                }

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