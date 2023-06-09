import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        getMarketProducts: async (_, __, { prisma }) => {

            try {

                return await prisma.marketplace_product.findMany({
                    include: {
                        seller: true
                    }
                })

            } catch (e) {
                throw new GraphQLError('Unable to fetch marketplace products')
            }

        }
    },
    Mutation: {
        addMarketProduct: async (_, { product }, { userInfo, prisma }) => {

            try {

                product.user_id = userInfo.userId

                return  await prisma.marketplace_product.create({
                    data: product
                })

            } catch (e) {
                throw new GraphQLError('Unable to create new product')
            }

        },
    }
}

export default resolvers