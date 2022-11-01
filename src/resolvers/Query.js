const Query = {
    me: (_, __, { userInfo, prisma }) => {
        if (!userInfo) return null
        return prisma.users.findUnique({
            where: {
                id: userInfo.userId
            }
        })
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