import {validateVeveUsername} from "../utils/validateVeveUsername.js"
import CollectiblePrice from "../../models/CollectiblePrices.js"
import {GraphQLError} from "graphql";
import {withFilter} from "graphql-subscriptions";
import fetch from "node-fetch";
import {setTimeout} from "node:timers/promises";

let tokenItems = []
let fullCapture = false
let i = 0
let pageSize = 200

const fetchInitialData = async (tokenCount, wallet_address) => {
    const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=eyJpZCI6IjB4YmFlNGNjNWM2ZDA4NDIxZGQ2OTdkZjQwYzQzYjQ1OTVmMTNkMTY2NjMzNjQzNWM5ZmJkODVjMmNkNjFiN2IxYyIsIm5hbWUiOiIjMDEgRWR1YXJkbyBSaXNzbyBCYXRtYW4iLCJ1cGRhdGVkX2F0IjoiMjAyMi0xMS0xMVQwOTowMDo1My4yNzE1OTdaIn0`)
    const walletItems = await getWalletItems.json()

    await walletItems.result.map(item => {
        i++
        tokenItems.push(Number(item.token_id))
    })

    if (!walletItems.cursor) fullCapture = true
    if (!fullCapture) {
        await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
    }
}
const keepFetchingData = async (cursor, tokenCount, wallet_address) => {
    try {
        await setTimeout(1500)
        // if (tokenCount <= 200) pageSize = tokenCount
        const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=${cursor}`)
        const walletItems = await getWalletItems.json()

        await walletItems.result.map(item => {
            tokenItems.push(Number(item.token_id))
        })

        if (!cursor) fullCapture = true
        if (!fullCapture) {
            console.log('still not a full capture, getting more....')
            await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
        }
    } catch (e) {
        console.log('[ERROR]: Something went wrong fetching more data.')
    }
}

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
    Mutation: {
        veveVaultImport: async (_, { payload }, { userInfo, prisma }) => {

            const { userId } = userInfo

            const { username, edition, collectible_id, project_id } = payload

            const token = await prisma.tokens.findFirst({
                where: {
                    collectibleId: collectible_id,
                    edition: edition
                },
                select: {
                    token_id: true,
                    mint_date: true,
                    name: true,
                },
            })

            const { token_id } = token

            const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
            const imxOwner = await getImxOwner.json()
            const wallet_address = imxOwner.user

            // TODO: Check if the wallet address is already assigned to a user
            // If the wallet is already assigned throw new error
            // Prompt user to use extension to validate their ownership

            // Get token count
            const getTokenCount = await fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.IMX_API
                },
                body: JSON.stringify({query: `query getWalletCollections { getWalletCollections(address: "${wallet_address}") { items { token_count } } }`})
            })
            const tokenCount = await getTokenCount.json()


            await fetchInitialData(tokenCount, wallet_address, userId, username, prisma)

            console.log('Total tokens in wallet is: ', tokenCount.data.getWalletCollections.items.length)

            const test = await prisma.tokens.findMany({
                where: {
                    token_id: { in: tokenItems },
                },
                select: {
                    collectibleId: true,
                    uniqueCoverId: true,
                    type: true
                }
            })

            let collectibleIds = []
            let uniqueCoverIds = []
            await test.map((asset) => {
                if (asset.type === 'collectible'){
                    collectibleIds.push(asset.collectibleId)
                } else if (asset.type === 'comic'){
                    uniqueCoverIds.push(asset.uniqueCoverId)
                }
            })

            const _collectibleIds = [...new Set(collectibleIds)]
            const _uniqueCoverIds = [...new Set(uniqueCoverIds)]

            await prisma.users.update({
                data: {
                    projects: {
                        connectOrCreate: {
                            where: { id: project_id },
                            create: { id: project_id }
                        }
                    },
                    veve_collectibles: {
                        connect: _collectibleIds.map((__collectibleId) => {
                            return { collectible_id: __collectibleId }
                        }),
                    },
                },
                where: {
                    id: userId
                },
            })

            await prisma.profile.update({
                data: {
                    onboarded: true,
                    veve_username: username,
                    veve_wallet_imported: true,
                    veve_wallet_address: wallet_address
                },
                where: {
                    user_id: userId
                }
            })

            return {
                "wallet_address": wallet_address,
                "token_count": tokenCount.data.getWalletCollections.items[0].token_count
            }

        },
    },
    Subscription: {
        veveVaultImport: async (_, {}, { pubsub }) => {
            return pubsub.asyncIterator(['VEVE_VAULT_IMPORT'])
        },
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