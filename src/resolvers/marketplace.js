import {GraphQLError} from "graphql";
import * as cloudinary from "cloudinary";
import {decodeCursor, encodeCursor} from "../utils/index.js";
import {conversationPopulated} from "./conversations.js";
import {messagePopulated} from "./message.js";

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
                        images: true,
                        offers: {
                            include: {
                                buyer: true
                            }
                        }
                    }
                })

            } catch (e) {
                console.log('nah: ', e)
                throw new GraphQLError('Unable to fetch marketplace product')
            }
        },
        getMarketProducts: async (_, { pagingOptions, sortOptions }, { prisma }) => {

            let limit = 20
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 150) return null

            let queryParams = { take: limit }
            if (pagingOptions && pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { id: decodeCursor(pagingOptions.after) } }

            queryParams = { ...queryParams, include: { seller: true, images: true, offers: true } }

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
        getMarketOffer: async (_, { id }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            return await prisma.marketplace_product_offers.findUnique({
                where: {
                    id: id
                },
                include: {
                    product: {
                        include: {
                            images: true
                        }
                    },
                    buyer: true,
                }
            })

        }
    },
    Mutation: {
        addMarketProduct: async (_, { product }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')
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
            if (!userInfo) throw new GraphQLError('Not authorised')
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

        },
        placeMarketOffer: async (_, { id, offer, seller_id, message }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            const { userId } = userInfo

            try {
                const createOffer = await prisma.marketplace_product_offers.create({
                    data: {
                        product_id: id,
                        buyer_id: userId,
                        seller_id: seller_id,
                        offer,
                        message
                    }
                })

                const existingConversation = await prisma.conversation.findMany({
                    where: {
                        owner_id: userId,
                        participants: {
                            every: {
                                user_id: { in: [seller_id, userId] }
                            }
                        }
                    }
                })

                if (existingConversation.length > 0){
                    const newMessage = await prisma.message.create({
                        data: {
                            senderId: userId,
                            conversationId: existingConversation[0].id,
                            type: "MARKETPLACE_OFFER",
                            body: `${userInfo.username} has sent you an offer`,
                            marketplace_offer_id: createOffer.id,
                        },
                        include: messagePopulated
                    })
                    const participant = await prisma.conversation_participant.findFirst({
                        where: {
                            user_id: userId,
                            conversation_id: existingConversation[0].id,
                        }
                    })
                    const conversation = await prisma.conversation.update({
                        where: {
                            id: existingConversation[0].id,
                        },
                        data: {
                            latest_message_id: newMessage.id,
                            participants: {
                                update: {
                                    where: {
                                        id: participant.id
                                    },
                                    data: {
                                        has_seen_latest_message: true
                                    }
                                },
                                updateMany: {
                                    where: {
                                        NOT: {
                                            user_id: userInfo.id
                                        }
                                    },
                                    data: {
                                        has_seen_latest_message: false
                                    }
                                }
                            }
                        },
                        include: conversationPopulated
                    })
                    pubsub.publish('MESSAGE_SENT', { messageSent: newMessage })
                    pubsub.publish('CONVERSATION_UPDATED', { conversationUpdated: { conversation } })

                } else {
                    const conversation = await prisma.conversation.create({
                        data: {
                            owner_id: userId,
                            participants: {
                                createMany: {
                                    data: [
                                        {
                                            user_id: seller_id,
                                            has_seen_latest_message: false
                                        },
                                        {
                                            user_id: userId,
                                            has_seen_latest_message: true
                                        }
                                    ]
                                }
                            }
                        },
                        include: conversationPopulated
                    })
                    pubsub.publish('CONVERSATION_CREATED', {
                        conversationCreated: conversation
                    })
                }

                await prisma.notifications.create({
                    data:{
                        type: "MARKETPLACE_OFFER",
                        content: `has placed an offer`,
                        reference: id,
                        from_user_id: userId,
                        to_user_id: seller_id
                    }
                })

            } catch (e) {
                throw new GraphQLError('Unable to create product offering')
            }

            return true
        }
    }
}

export default resolvers