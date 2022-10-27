import { Context } from '../index'

export const Query ={
    me: (_: any, __: any, { userInfo, prisma }: Context) => {
        if (!userInfo) return null
        return prisma.users.findUnique({
            where: {
                id: userInfo.userId
            }
        })
    },
    profile: (_:any, { userId }: { userId: String }, { prisma }: Context) => {
        return prisma.profile.findUnique({
            where: {
                user_id: Number(userId)
            }
        })
    },
    posts: async (_: any, __: any, { prisma }: Context) => {
        return prisma.post.findMany({
            where: {
                published: true
            },
            orderBy: [
                {
                    createdAt: "desc"
                }
            ]
        })

    }
}