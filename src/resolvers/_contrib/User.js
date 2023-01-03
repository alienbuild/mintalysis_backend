import {decodeCursor, encodeCursor} from "../../utils/index.js"

const User = {
    // posts: (parent, __, { userInfo, prisma }) => {
    //     const isOwnAccount = parent.id === userInfo?.userId
    //
    //     if (isOwnAccount){
    //         return prisma.posts.findMany({
    //             where: {
    //                 author_id: parent.id
    //             },
    //             orderBy: [
    //                 {
    //                     createdAt: 'desc'
    //                 }
    //             ]
    //         })
    //     } else {
    //         return prisma.posts.findMany({
    //             where: {
    //                 author_id: parent.id,
    //                 published: true
    //             },
    //             orderBy: [
    //                 {
    //                     createdAt: 'desc'
    //                 }
    //             ]
    //         })
    //     }
    // },
    profile: (parent, __, { prisma }) => {
        return prisma.profile.findUnique({
            where: {
                user_id: parent.id
            }
        })
    },
    veve_collectibles: async (parent, { sortOptions, pagingOptions }, {userInfo, prisma}) => {
        let limit = 25
        let sortParams = { drop_date: 'asc' }
        let queryParams = {}

        if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }

        if (pagingOptions){
            console.log('pagingOptions is: ', pagingOptions)
            console.log('pagingOptions is: ', pagingOptions.after)
            if (pagingOptions.limit) limit = pagingOptions.limit
            if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(pagingOptions.after) }}
        }

        queryParams = { ...queryParams, take: limit, orderBy: [sortParams] }


        const collectibles = await prisma.users.findUnique({
            where: {
                id: userInfo.userId
            },
            include: {
                veve_collectibles: queryParams,
                _count: {
                    select: { veve_collectibles: true },
                }
            }
        })

        const totalCount = collectibles._count.veve_collectibles

        return {
            edges: collectibles.veve_collectibles,
            totalCount: totalCount,
            pageInfo:{
                endCursor: collectibles.veve_collectibles.length > 1 ? encodeCursor(collectibles.veve_collectibles[collectibles.veve_collectibles.length - 1].collectible_id) : null
            }
        }

    }
    // projects: (parent, __, { prisma }) => {
    //     console.log('parent is: ', parent)
    //
    //     return prisma.nft_projects.findMany({
    //         where: {
    //             id: parent.id
    //         }
    //     })
    // }
}

export { User }