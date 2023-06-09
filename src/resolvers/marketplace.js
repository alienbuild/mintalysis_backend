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

        },
        getMarketProduct: async (_, { id }, { prisma, userInfo }) => {
            try {

                const product = await prisma.marketplace_product.findUnique({
                    where:{
                        id: id
                    },
                    include: {
                        seller: true
                    }
                })

                if (userInfo.userId !== product.seller.id) throw new GraphQLError('Unauthorised.')

                return product

            } catch (e) {
                console.log('Nah: ', e)
                throw new GraphQLError('Unable to fetch marketplace product')
            }
        }
    },
    Mutation: {
        addMarketProduct: async (_, { product }, { userInfo, prisma }) => {

            try {

                product.user_id = userInfo.userId

                console.log('product to add is: ', product)

                return  await prisma.marketplace_product.create({
                    data: product
                })

            } catch (e) {
                console.log('nah: ', e)
                throw new GraphQLError('Unable to create new product')
            }

        },
    }
}

export default resolvers