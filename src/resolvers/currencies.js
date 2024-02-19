import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        getCurrencyRates: async (_, __, { prisma }) => {
            try {
                return await prisma.currency_rate.findFirst({
                    orderBy: {
                        updatedAt: 'desc',
                    },
                })
            } catch (error) {
                console.log('Unable to fetch currency rates: ', error)
                throw new GraphQLError('Unable to fetch currency rates')
            }

        },
    }
}

export default resolvers