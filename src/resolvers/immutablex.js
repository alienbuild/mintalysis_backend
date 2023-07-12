import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        getImxVeveStats: async (_, { project_id }, { prisma }) => {

            return await prisma.imx_stats.findFirst({
                where: {
                    project_id: project_id
                }
            })

        },
        getImxVeveTransfers: async (_, { token_id, pagingOptions }, { prisma }) => {

            let limit = 10
            if (pagingOptions && pagingOptions.limit) limit = pagingOptions.limit

            let queryParams = { take: limit, orderBy: { timestamp: 'desc' } }
            let transfers
            if (token_id){
                transfers = await prisma.veve_transfers.findMany({
                    where: {
                        token_id: token_id
                    },
                })
            } else {
                transfers = await prisma.veve_transfers.findMany(queryParams)
            }

            return {
                edges: transfers,
                pageInfo: {
                    endCursor: transfers.length > 1 ? encodeCursor(String(transfers[transfers.length - 1].token_id)) : null
                }
            }
        },
        getWalletTransfers: async (_, {walletId, pagingOptions, sortOptions}, { prisma }) => {

            console.log('pagingOptions is: ', pagingOptions)
            console.log('sortingOptions is: ', sortOptions)

            let limit = 5
            if (pagingOptions.limit) limit = pagingOptions.limit

            let whereParams = {}
            let sortParams = { timestamp: 'asc' }
            let queryParams = { take: limit }

            if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { id: Number(decodeCursor(pagingOptions.after)) } }
            if (sortOptions && sortOptions.sortBy) sortParams = { [sortOptions.sortBy]: sortOptions.sortDirection }
            if (walletId) whereParams = { ...whereParams, OR: [{ to_wallet: walletId }, { from_wallet: walletId }] }

            queryParams = { ...queryParams, where: { ...whereParams }, orderBy: [sortParams] }

            const transfers = await prisma.veve_transfers.findMany(queryParams)

            return {
                edges: transfers,
                totalCount: 0,
                pageInfo: {
                    endCursor: transfers.length > 1 ? encodeCursor(String(transfers[transfers.length - 1].id)) : null,
                }
            }
        },
    },
    Subscription: {
        imxVeveStatsUpdated: {
            subscribe: (_, payload, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_STATS_UPDATED'])
            }
        },
        imxVeveTxnsUpdated: {
            subscribe: (_, payload, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_TRANSFERS_UPDATED'])
            }
        }
    },
    VeveTransfer: {
        token: async ({ token_id }, __, { prisma }) => {
            return await prisma.veve_tokens.findUnique({
                where: {
                    token_id: token_id
                }
            })
        },
        tags: async (args, __, { prisma }) => {

            const toWalletTag = await prisma.veve_wallets.findFirst({
                where: {
                    id: args.to_wallet,
                },
                select: {
                    tags: true
                }
            })

            const fromWalletTag = await prisma.veve_wallets.findFirst({
                where: {
                    id: args.from_wallet,
                },
                select: {
                    tags: true
                }
            })

            return [
                {
                    from_wallet: { tag: fromWalletTag.tags.name },
                    to_wallet: { tag: toWalletTag.tags.name },
                },
            ]
        }
    },
}

export default resolvers