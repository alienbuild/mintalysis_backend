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
        getMarketProduct: async (_, { id }, { prisma }) => {
            try {

                return await prisma.marketplace_product.findUnique({
                    where: {
                        id: id
                    },
                    include: {
                        seller: true
                    }
                })

            } catch (e) {
                throw new GraphQLError('Unable to fetch marketplace product')
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
                console.log('nah: ', e)
                throw new GraphQLError('Unable to create new product')
            }

        },
        updateMarketProduct: async (_, { product }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Unauthorised.')
            if (!product.id) throw new GraphQLError('Please supply a market product id.')

            const exisitingProduct = await prisma.marketplace_product.findUnique({
                where:{
                    id: product.id
                },
                include: {
                    seller: true
                }
            })

            if (exisitingProduct.seller.id !== userInfo.userId) throw new GraphQLError('This product does not belong to you.')

            return await prisma.marketplace_product.update({
                where: {
                    id: product.id
                },
                data: product
            })

        },
        removeMarketProduct: async (_, { id }, { prisma, userInfo }) => {

            if (!userInfo) throw new GraphQLError('Unauthorised.')
            if (!id) throw new GraphQLError('Please supply a market product id.')

            try {
                const product = await prisma.marketplace_product.findUnique({
                    where: {
                        id: id
                    },
                    include: {
                        seller: true
                    }
                })

                if (product.seller.id !== userInfo.userId) throw new GraphQLError('This product does not belong to you.')

                await prisma.marketplace_product.delete({
                    where: {
                        id: id
                    }
                })

                return true

            } catch (e) {
                throw new GraphQLError('Unable to remove market product.')
            }

        }
    }
}

export default resolvers