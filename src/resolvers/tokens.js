import {decodeCursor, encodeCursor} from "../utils/index.js"

const resolvers = {
    Query: {
        tokens: async (_, { token_id, type, search, limit = 15, after, userId, editionNumber, collectibleId, uniqueCoverId, kraken }, { prisma }) => {
            if (kraken) limit = 10000
            let queryParams = { take: limit }
            let whereParams = {}

            if (after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(after)) } }

            if (search) whereParams = { ...whereParams, name: { contains: search } }
            if (type) whereParams = { ...whereParams, type: type }
            if (userId) {
                whereParams = { ...whereParams, user_id: userId }
                queryParams = { ...queryParams, distinct: ['collectibleId', 'uniqueCoverId']}
            }
            if (editionNumber) whereParams = { ...whereParams, edition: editionNumber }
            if (collectibleId) whereParams = { ...whereParams, collectibleId: collectibleId }
            if (uniqueCoverId) whereParams = { ...whereParams, uniqueCoverId: uniqueCoverId }

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

                tokens = await prisma.tokens.findMany(queryParams)

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
                //         collectibleId: true
                //     }
                // })
                // console.log('tokenCollectibleIds: ', tokenCollectibleIds)

                // tokens.map(async (token) => {
                //     const collectibleValue = await prisma.veve_collectibles.findMany({
                //         where: {
                //             collectibleId: token.collectible_id
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
                tokens = [await prisma.tokens.findUnique({where: {token_id: Number(token_id)}})]
            } else {
                tokens = await prisma.tokens.findMany(queryParams)
            }

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }

        },
    },
    Token: {
        collectible: async ({type, collectibleId}, __, { prisma }) => {
            if (type !== 'collectible') return null

            return await prisma.veve_collectibles.findUnique({
                where: {
                    collectible_id: collectibleId
                }
            })
        },
        comic: async ({type, uniqueCoverId}, __, { prisma }) => {
            if (type !== 'comic') return null

            return await prisma.veve_comics.findUnique({
                where: {
                    uniqueCoverId: uniqueCoverId
                }
            })
        }
    }
}

export default resolvers