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
    }
}

export default resolvers