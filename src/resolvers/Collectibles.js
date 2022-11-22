import {decodeCursor, encodeCursor} from "../utils/index.js";

const Collectible = {
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

    }
}

export { Collectible }