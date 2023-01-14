import {decodeCursor, encodeCursor} from "../utils/index.js"

const resolvers = {
    Query: {
        comics: async (_, {search, limit = 5, after}, { prisma }) => {
            if (limit > 100) return null

            let queryParams = { take: limit, orderBy: [{ createdAt: 'desc' }] }

            if (after) queryParams = { ...queryParams, skip: 1, cursor: { uniqueCoverId: decodeCursor(after) } }
            if (search) { queryParams = { ...queryParams, where: { name: { contains: search } }} }

            const comics = await prisma.veve_comics.findMany(queryParams)

            return {
                edges: comics,
                pageInfo: {
                    endCursor: comics.length > 1 ? encodeCursor(comics[comics.length - 1].uniqueCoverId) : null,
                }
            }
        },
    },
    Comic: {
        tokens: async ({uniqueCoverId}, {sortOptions, pagingOptions}, { prisma }) => {
            let limit = 15
            let sortParams = { edition: 'asc' }
            let queryParams = {}
            let whereParams = { "uniqueCoverId" : uniqueCoverId }
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

        }
    }
}

export default resolvers