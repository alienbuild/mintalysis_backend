import {decodeCursor, encodeCursor} from "../utils/index.js"
import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        tokens: async (_, { token_id, type, search, limit = 15, after, userId, editionNumber, collectible_id, unique_cover_id, kraken }, { prisma }) => {
            if (kraken) limit = 10000
            let queryParams = { take: limit }
            let whereParams = {}

            if (after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(after)) } }

            if (search) whereParams = { ...whereParams, name: { contains: search } }
            if (type) whereParams = { ...whereParams, type: type }
            if (userId) {
                whereParams = { ...whereParams, user_id: userId }
                queryParams = { ...queryParams, distinct: ['collectible_id', 'unique_cover_id']}
            }
            if (editionNumber) whereParams = { ...whereParams, edition: editionNumber }
            if (collectible_id) whereParams = { ...whereParams, collectible_id: collectible_id }
            if (unique_cover_id) whereParams = { ...whereParams, unique_cover_id: unique_cover_id }

            let tokens

            if (kraken){
                whereParams = { ...whereParams, tmp_unregistered_user: 'KRAKEN' }
                queryParams = { ...queryParams, where: { ...whereParams } }
                queryParams = {
                    ...queryParams,
                    include: {
                        collectible: {
                            select: {
                                floor_price: true
                            }
                        }
                    }
                }

                tokens = await prisma.veve_tokens.findMany(queryParams)

                // console.log('tokens is: ', tokens)
                let valuation = 0
                tokens.map((token) => {
                    if (token.collectible?.floor_price){
                        valuation += Number(token.collectible?.floor_price)
                    }
                })

                // let valuation = 0
                // const tokenCollectibleIds = await prisma.tokens.findMany({
                //     where: { tmp_unregistered_user: 'KRAKEN' },
                //     select: {
                //         collectible_id: true
                //     }
                // })
                // console.log('tokenCollectibleIds: ', tokenCollectibleIds)

                // tokens.map(async (token) => {
                //     const collectibleValue = await prisma.veve_collectibles.findMany({
                //         where: {
                //             collectible_id: token.collectible_id
                //         },
                //         select: {
                //             floor_price: true
                //         }
                //     })
                //     collectibleValue.map((value) => {
                //         console.log('value is: ', value.floor_price)
                //         valuation += Number(value.floor_price)
                //     })
                //     console.log('valuation is: ', valuation)
                // })

                return {
                    edges: tokens,
                    pageInfo: {
                        endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                    },
                    summary: {
                        valuation: valuation,
                        count: tokens.length
                    }
                }
            }
            queryParams = { ...queryParams, where: { ...whereParams } }

            if (token_id) {
                tokens = [await prisma.veve_tokens.findUnique({where: {token_id: Number(token_id)}})]
            } else {
                tokens = await prisma.veve_tokens.findMany(queryParams)
            }

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }

        },
        getUsersVeveTokens: async (_, { token_id, grouped, type, search, pagingOptions, editionNumber, collectible_id, unique_cover_id }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit


            let queryParams = { take: limit }
            let whereParams = { user_id: userInfo.userId }

            if (pagingOptions?.after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(pagingOptions.after)) } }
            if (search) whereParams = { ...whereParams, name: { contains: search } }

            if (grouped) queryParams = { ...queryParams, distinct: ['collectible_id', 'unique_cover_id']}
            if (editionNumber) whereParams = { ...whereParams, edition: editionNumber }
            if (collectible_id) whereParams = { ...whereParams, collectible_id: collectible_id }
            if (unique_cover_id) whereParams = { ...whereParams, unique_cover_id: unique_cover_id }

            let tokens

            queryParams = { ...queryParams, where: { ...whereParams } }

            if (token_id) {
                tokens = [await prisma.veve_tokens.findUnique({where: {token_id: Number(token_id)}})]
            } else {
                tokens = await prisma.veve_tokens.findMany(queryParams)
            }

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }

            // return await prisma.veve_tokens.findMany({
            //     where: {
            //         user_id: userInfo.userId
            //     },
            //     distinct: ['collectible_id'],
            //     take: limit
            // })

        }
    },
    Token: {
        collectible: async (args, __, { prisma }) => {
            if (args.type !== 'collectible') return null

            return await prisma.veve_collectibles.findUnique({
                where: {
                    collectible_id: args.collectible_id
                }
            })
        },
        comic: async ({type, unique_cover_id}, __, { prisma }) => {
            if (type !== 'comic') return null

            return await prisma.veve_comics.findUnique({
                where: {
                    unique_cover_id: unique_cover_id
                }
            })
        }
    }
}

export default resolvers