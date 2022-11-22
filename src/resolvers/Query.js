import {checkVeveUsername} from "../utils/checkVeveUsername.js"
import {decodeCursor, encodeCursor} from "../utils/index.js"

const Query = {
    me: (_, __, { userInfo, prisma }) => {
        if (!userInfo) return null
        return prisma.users.findUnique({
            where: {
                id: userInfo.userId
            }
        })
    },
    tokens: async (_, { type, search, limit = 15, after, userId, editionNumber, collectibleId, uniqueCoverId }, { prisma }) => {
        let queryParams = { take: limit, orderBy: [{ mint_date: 'desc' }] }
        let whereParams = {}

        if (after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: decodeCursor(Number(after)) } }
        if (search) whereParams = { ...whereParams, name: { contains: search } }
        if (type) whereParams = { ...whereParams, type: type }
        if (userId) whereParams = { ...whereParams, user_id: userId }
        if (editionNumber) whereParams = { ...whereParams, edition: editionNumber }
        if (collectibleId) whereParams = { ...whereParams, collectibleId: collectibleId }
        if (uniqueCoverId) whereParams = { ...whereParams, uniqueCoverId: uniqueCoverId }

        queryParams = { ...queryParams, where: { ...whereParams } }

        const tokens = await prisma.tokens.findMany(queryParams)

        return {
            edges: tokens,
            pageInfo: {
                endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
            }
        }

    },
    veveUser: async (_, {username}, ___) => {
        let returnArr = []
        try {
            const userList = await checkVeveUsername(username)
            userList.edges.map((user) => {
                returnArr.push(user.node.username)
            })
        } catch (err) {
            console.log('[ERROR] Fetching user list from VEVE api: ', err)
        }

        return returnArr
    },
    collectibles: async (_, { search, limit = 5, after }, { prisma }) => {

        if (limit > 100) return null

        let queryParams = { take: limit, orderBy: [{ createdAt: 'desc' }] }

        if (after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(after) } }
        if (search) { queryParams = { ...queryParams, where: { name: { contains: search } }} }

        const collectibles = await prisma.collectibles.findMany(queryParams)

        return {
            edges: collectibles,
            pageInfo: {
                endCursor: collectibles.length > 1 ? encodeCursor(collectibles[collectibles.length - 1].collectible_id) : null,
            }
        }

    },
    profile: async (_, {userId}, {prisma, userInfo}) => {

        const isMyProfile = Number(userId) === userInfo?.userId

        const profile = await prisma.profile.findUnique({
            where: {
                user_id: Number(userId)
            }
        })

        if (!profile) return null

        return {
            ...profile,
            isMyProfile
        }
    },
    posts: async (_, __, { prisma }) => {
        return prisma.posts.findMany({
            where: {
                published: true
            },
            orderBy: [
                {
                    createdAt: "desc"
                }
            ]
        })
    },
    message: (_, {ID}) => prisma.messages.findUnique({ where: { id: ID} })
}

export { Query }