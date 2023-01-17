import {validateVeveUsername} from "../utils/validateVeveUsername.js"
import CollectiblePrice from "../../models/CollectiblePrices.js"
import {GraphQLError} from "graphql";
import {withFilter} from "graphql-subscriptions";

const resolvers = {
    Query: {
        veveCollectiblePriceData: async (_, { collectibleId, type, period }, { userInfo, prisma }) => {
            let groupOption = { $dateToString: { format: "%Y-%m-%dT%H", date: "$at" } }
            switch (period){
                case 7:
                    groupOption = { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                    break
                case 90:
                    groupOption = { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                    break
                default:
                    groupOption = { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                    break
            }

            return await CollectiblePrice.aggregate([
                {
                    "$match": {
                        collectibleId: collectibleId,
                        // "date": {
                        //     $gte: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000))
                        // }
                    }
                },
                {
                    "$group": {
                        _id: {
                            symbol: "$collectibleId",
                            date: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "day",
                                    binSize: 1
                                },
                            },
                        },
                        value: { $avg: "$value" },
                        high: { $max: "$value" },
                        low: { $min: "$value" },
                        open: { $first: "$value" },
                        close: { $last: "$value" },
                        volume: { $avg: "$volume" },
                    }
                },
                {
                    "$set": {
                        date: "$_id.date",
                    }
                },
                {
                    $sort : { "date": 1 }
                }
            ])
                .then(data => {
                    return data
                })
                .catch(err => {
                    throw new GraphQLError('Unable to get collectible data.')
                })

        },
        validateVeveUsername: async (_, {username}, ___) => {
            let returnArr = []
            try {
                const userList = await validateVeveUsername(username)
                userList.edges.map((user) => {
                    returnArr.push(user.node.username)
                })
            } catch (err) {
                console.log('[ERROR] Fetching user list from VEVE api: ', err)
            }

            return returnArr
        },
    },
    Mutation: {},
    Subscription: {
        // veveCollectiblePrice: {
        //     subscribe: async (_, {collectible_id}, { pubsub }) => {
        //         console.log('sub id is: ', collectible_id)
        //         return pubsub.asyncIterator([`VEVE_COLLECTIBLE_UPDATED`])
        //     }
        // }
        veveCollectiblePrice: {
            subscribe: (_, { veveCollectiblePrice }, { pubsub }) => {
                return pubsub.asyncIterator(['VEVE_PRICES_UPDATED'])
            }
        }
    },
    User: {}
}

export default resolvers