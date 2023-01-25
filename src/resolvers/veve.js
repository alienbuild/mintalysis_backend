import {validateVeveUsername} from "../utils/validateVeveUsername.js"
import CollectiblePrice from "../../models/CollectiblePrices.js"
import {GraphQLError} from "graphql"
import fetch from "node-fetch"
import {setTimeout} from "node:timers/promises"
import {decodeCursor, encodeCursor, truncate} from "../utils/index.js"

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
        veveCollectibles: async (_, { collectibleId, search, limit = 5, after }, { prisma }) => {

            if (limit > 100) return null

            let queryParams = { take: limit, orderBy: [{ createdAt: 'desc' }] }
            let whereParams = {}

            if (collectibleId) whereParams = {...whereParams, collectible_id: collectibleId }
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(after) } }
            if (search) whereParams = {...whereParams, name: { contains: search} }

            queryParams = { ...queryParams, where: { ...whereParams } }

            const collectibles = await prisma.veve_collectibles.findMany(queryParams)

            return {
                edges: collectibles,
                pageInfo: {
                    endCursor: collectibles.length > 1 ? encodeCursor(collectibles[collectibles.length - 1].collectible_id) : null,
                }
            }

        },
        getUserMagicSet: async (_, { seriesId }, { prisma, userInfo }) => {

            const setTotal = await prisma.veve_collectibles.count({
                where: {
                    series_id: seriesId
                },
            })

            const groupBy = await prisma.veve_tokens.groupBy({
                by: ['edition'],
                where: {
                    user_id: userInfo.userId,
                    series_id: seriesId
                },
                _count: {
                    edition: true,
                },
                orderBy: {
                    _count: {
                        edition: 'desc',
                    },
                },
            })

            let magicSets = []
            await Promise.all(
                groupBy.map(async (groupedToken, index) => {
                    if (groupedToken._count.edition > 1) {
                        const edition = groupedToken.edition

                        const set = await prisma.veve_tokens.findMany({
                            where: {
                                edition: edition,
                                series_id: seriesId,
                                user_id: userInfo.userId,
                            },
                            select: {
                                name: true,
                                edition: true,
                                rarity: true,
                                series: {
                                    select: {
                                        name: true,
                                        season: true
                                    }
                                },
                            },
                        })
                        magicSets.push({ set, edition, count: set.length, series_name: set[0].series.name, season: set[0].series.season, setTotal })
                    }
                })
            )

            magicSets.sort((a,b) => b.count - a.count)

            return magicSets

        }
    },
    Mutation: {
        veveVaultImport: async (_, { payload }, { userInfo, prisma, pubsub }) => {

            const { userId } = userInfo

            const { username, edition, collectible_id, project_id } = payload

            const token = await prisma.veve_tokens.findFirst({
                where: {
                    collectible_id: collectible_id,
                    edition: edition
                },
                select: {
                    token_id: true,
                },
            })

            const { token_id } = token

            const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
            const imxOwner = await getImxOwner.json()
            const wallet_address = await imxOwner.user

            await pubsub.publish('VEVE_VAULT_IMPORT', {
                veveVaultImport: {
                    user_id: userInfo.userId,
                    message: `Wallet found: ${truncate(wallet_address, 20)}`,
                    complete: false
                }
            })

            // TODO: Check if the wallet address is already assigned to a user
            // If the wallet is already assigned throw new error
            // Prompt user to use extension to validate their ownership

            await fetchInitialData(tokenItems.length, wallet_address, userId, username, prisma, pubsub, userInfo)

            await pubsub.publish('VEVE_VAULT_IMPORT', {
                veveVaultImport: {
                    user_id: userInfo.userId,
                    message: `${tokenItems.length} tokens have been found. Saving...`,
                    complete: false
                }
            })

            console.log('clearing wallet')
            await prisma.veve_tokens.updateMany({
                where: {
                    user_id: userId
                },
                data: {
                    user_id: null
                }
            })
            console.log('wallet cleared.')

            await prisma.veve_tokens.updateMany({
                data: {
                    user_id: userId
                },
                where: {
                    token_id: { in: tokenItems }
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

            await pubsub.publish('VEVE_VAULT_IMPORT', {
                veveVaultImport: {
                    user_id: userInfo.userId,
                    message: `Your vault has been successfully imported, thank you.`,
                    complete: true
                }
            })

            return {
                "wallet_address": wallet_address,
                "token_count": tokenItems.length
            }

        },
    },
    Subscription: {
        veveVaultImport: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['VEVE_VAULT_IMPORT'])
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
    User: {},
    Collectible: {
        tokens: async ({collectible_id}, {sortOptions, pagingOptions}, { prisma }) => {
            let limit = 15
            let sortParams = { edition: 'asc' }
            let queryParams = {}
            let whereParams = { "collectibleId" : collectible_id }
            if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }
            if (pagingOptions){
                if (pagingOptions.limit) limit = pagingOptions.limit
                if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(pagingOptions.after)) }}
            }
            queryParams = { ...queryParams, take: limit, orderBy: [sortParams], where: { ...whereParams } }

            const tokens = await prisma.veve_tokens.findMany(queryParams)

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }
        },
        quantity: async ({ collectible_id }, __, { prisma, userInfo }) => {
            try {
                return await prisma.veve_tokens.count({
                    where: {
                        collectible_id: collectible_id,
                        user_id: userInfo.userId
                    },
                })
            } catch(err) {
                throw new GraphQLError('Could not count collectibles.')
            }
        },
        valuations: async ({ collectible_id }, { period }, { prisma }) => {
            switch (period){
                case 1:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 2:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (48 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 7:
                    console.log('7 day period...')
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 28 || 30:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 90:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                default:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
            }
        }
    }
}

export default resolvers