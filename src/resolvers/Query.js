import {checkVeveUsername} from "../utils/checkVeveUsername.js";

const Query = {
    me: (_, __, { userInfo, prisma }) => {
        if (!userInfo) return null
        return prisma.users.findUnique({
            where: {
                id: userInfo.userId
            }
        })
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
    collectibles: async (_, __, { prisma }) => {
        return prisma.posts.findMany({
            orderBy: [
                {
                    createdAt: "desc"
                }
            ]
        })
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