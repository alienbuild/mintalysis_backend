const resolvers = {
    Query: {
        getImxVeveStats: async (_, { project_id }, { prisma }) => {

            const stats = await prisma.imx_stats.findFirst({
                where: {
                    project_id: project_id
                }
            })

            return {
                tokenCount: stats.token_count,
                walletCount: stats.wallet_count,
                transactionCount: stats.transaction_count,
                uniqueOwnersCount: stats.unique_owners_count
            }
        }
    },
    Subscription: {
        imxVeveStatsUpdated: {
            subscribe: (_, __, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_STATS_UPDATED'])
            }
        }
    }
}

export default resolvers