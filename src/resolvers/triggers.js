const resolvers = {
    Mutation: {
        triggerImxTransfer: async (_, __, { pubsub }) => {
            pubsub.publish('IMX_VEVE_TRANSFERS_UPDATED', {});
            return true
        },
        triggerImxMint: async (_, __, { pubsub }) => {
            pubsub.publish('IMX_VEVE_MINTS_UPDATED', {})
            return true
        }
    }
}

export default resolvers