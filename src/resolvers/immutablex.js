import {encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        getImxVeveStats: async (_, { project_id }, { prisma }) => {

            return await prisma.imx_stats.findFirst({
                where: {
                    project_id: project_id
                }
            })

        },
        getImxVeveTransfers: async (_, {token_id, limit = 10}, { prisma }) => {

            let queryParams = { take: limit }
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