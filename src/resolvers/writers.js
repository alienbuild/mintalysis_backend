import {decodeCursor, encodeCursor} from "../utils/index.js"

const resolvers = {
    Query: {
        getWriters: async (_, { authorId, slug, search, limit = 15, after }, { prisma }) => {

            let queryParams = { take: limit }
            let whereParams = {}

            let writers
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { characterId: Number(decodeCursor(after)) } }
            if (search) whereParams = { ...whereParams, name: { contains: search }}

            queryParams = { ...queryParams, where: { ...whereParams } }

            writers = await prisma.writers.findMany(queryParams)
            if (authorId) writers = [await prisma.writers.findUnique({ where: { author_id: authorId } })]
            if (slug) writers = [await prisma.writers.findUnique({ where: { slug: slug } })]

            return {
                edges: writers,
                totalCount: writers.length,
                pageInfo: {
                    endCursor: writers.length > 1 ? encodeCursor(String(writers[writers.length - 1].author_id)) : null
                }
            }
        }
    },
}

export default resolvers