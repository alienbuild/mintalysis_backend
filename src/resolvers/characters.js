import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        getCharacters: async (_, { characterId, slug, search, limit = 15, after }, { prisma }) => {

            console.log('slug detected: ', slug)

            let queryParams = { take: limit }
            let whereParams = {}

            let characters
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { characterId: Number(decodeCursor(after)) } }
            if (search) whereParams = { ...whereParams, name: { contains: search }}

            queryParams = { ...queryParams, where: { ...whereParams } }

            characters = await prisma.characters.findMany(queryParams)
            if (characterId) characters = [await prisma.characters.findUnique({ where: { character_id: characterId } })]
            if (slug) characters = [await prisma.characters.findUnique({ where: { slug: slug } })]

            return {
                edges: characters,
                totalCount: characters.length,
                pageInfo: {
                    endCursor: characters.length > 1 ? encodeCursor(String(characters[characters.length - 1].character_id)) : null
                }
            }
        }
    },
}

export default resolvers