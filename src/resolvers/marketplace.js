import {GraphQLError} from "graphql";
import * as cloudinary from "cloudinary";
import {decodeCursor, encodeCursor} from "../utils/index.js";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const resolvers = {
    Query: {
        getMarketProduct: async (_, { id }, { prisma }) => {
            try {

                return await prisma.marketplace_product.findUnique({
                    where: {
                        id: id
                    },
                    include: {
                        seller: true,
                        images: true
                    }
                })

            } catch (e) {
                throw new GraphQLError('Unable to fetch marketplace product')
            }
        },
        getMarketProducts: async (_, { pagingOptions, sortOptions }, { prisma }) => {

            let limit = 20
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 150) return null

            let queryParams = { take: limit }
            if (pagingOptions && pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { id: decodeCursor(pagingOptions.after) } }

            queryParams = { ...queryParams, include: { seller: true, images: true } }

            try {

                const marketProducts = await prisma.marketplace_product.findMany(queryParams)

                return {
                    edges: marketProducts,
                    pageInfo: {
                        endCursor: marketProducts.length > 1 ? encodeCursor(marketProducts[marketProducts.length - 1].id) : null
                    },
                    totalCount: await prisma.marketplace_product.count()
                }

            } catch (e) {
                throw new GraphQLError('Unable to fetch marketplace products')
            }

        },
    },
    Mutation: {
        addMarketProduct: async (_, { product }, { userInfo, prisma }) => {

            try {

                product.user_id = userInfo.userId

                let imageUrls = []

                for (let i = 0; i < product.images.length; i++) {
                    const imageExists = await product.images[i].file
                    if (imageExists){
                        const result = await new Promise(async (resolve, reject) => {
                            await imageExists.createReadStream().pipe(cloudinary.v2.uploader.upload_stream((error, result) => {
                                if (error) {
                                    reject(error)
                                }

                                resolve(result)
                            }))
                        })
                        imageUrls.push({ "url": result.secure_url })
                    }
                }

                delete product.images

                return await prisma.marketplace_product.create({
                    data: {
                        ...product,
                        images: {
                            create: imageUrls.map(url => url)
                        }
                    },
                    include: {
                        images: true
                    }
                })

            } catch (e) {
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