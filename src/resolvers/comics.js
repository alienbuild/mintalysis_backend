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
}

export default resolvers