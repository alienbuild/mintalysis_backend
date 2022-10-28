import { Context } from '../index'

interface UserParentType {
    id: number
}

export const User = {
    posts: (parent: UserParentType, __: any, { userInfo, prisma }: Context) => {
        const isOwnAccount = parent.id === userInfo?.userId

        if (isOwnAccount){
            return prisma.posts.findMany({
                where: {
                    author_id: parent.id
                },
                orderBy: [
                    {
                        createdAt: 'desc'
                    }
                ]
            })
        } else {
            return prisma.posts.findMany({
                where: {
                    author_id: parent.id,
                    published: true
                },
                orderBy: [
                    {
                        createdAt: 'desc'
                    }
                ]
            })
        }
    },
}