import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        getArtists: async (_, { artistId, slug, search, limit = 15, after }, { prisma }) => {

            let queryParams = { take: limit }
            let whereParams = {}

            let artists
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { artist_id: Number(decodeCursor(after)) } }
            if (search) whereParams = { ...whereParams, name: { contains: search }}

            queryParams = { ...queryParams, where: { ...whereParams } }

            artists = await prisma.artists.findMany(queryParams)
            if (artistId) artists = [await prisma.artists.findUnique({ where: { artist_id: artistId } })]
            if (slug) artists = [await prisma.artists.findUnique({ where: { slug: slug } })]

            return {
                edges: artists,
                totalCount: artists.length,
                pageInfo: {
                    endCursor: artists.length > 1 ? encodeCursor(String(artists[artists.length - 1].artist_id)) : null
                }
            }
        }
    },
}

export default resolvers