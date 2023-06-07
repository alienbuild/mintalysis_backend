const resolvers = {
    Mutation: {
        addMarketProduct: async (_, { product }, { userInfo, prisma }) => {
            console.log('addMarketProduct is: ', product)

            return true
        },
    }
}

export default resolvers