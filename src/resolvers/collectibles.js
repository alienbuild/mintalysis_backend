import {decodeCursor, encodeCursor} from "../utils/index.js"
import CollectiblePrice from "../../models/CollectiblePrices.js"

const resolvers = {
    Query: {
        collectibles: async (_, { id, search, limit = 5, after }, { prisma }) => {

            if (limit > 100) return null

            let queryParams = { take: limit, orderBy: [{ createdAt: 'desc' }] }
            let whereParams = {}

            if (id) whereParams = {...whereParams, collectible_id: id }
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(after) } }
            if (search) whereParams = {...whereParams, name: { contains: search} }

            queryParams = { ...queryParams, where: { ...whereParams } }

            const collectibles = await prisma.veve_collectibles.findMany(queryParams)

            return {
                edges: collectibles,
                pageInfo: {
                    endCursor: collectibles.length > 1 ? encodeCursor(collectibles[collectibles.length - 1].collectible_id) : null,
                }
            }

        },
    },
    Collectible: {
        tokens: async ({collectible_id}, {sortOptions, pagingOptions}, { prisma }) => {
            let limit = 15
            let sortParams = { edition: 'asc' }
            let queryParams = {}
            let whereParams = { "collectibleId" : collectible_id }
            if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }
            if (pagingOptions){
                if (pagingOptions.limit) limit = pagingOptions.limit
                if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(pagingOptions.after)) }}
            }
            queryParams = { ...queryParams, take: limit, orderBy: [sortParams], where: { ...whereParams } }

            const tokens = await prisma.tokens.findMany(queryParams)

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }
        },
        valuations: async ({ collectible_id }, { period }, { prisma }) => {
            switch (period){
                case 1:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 2:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (48 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 7:
                    console.log('7 day period...')
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 28 || 30:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 90:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                default:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
            }
        }

    }
}

export default resolvers