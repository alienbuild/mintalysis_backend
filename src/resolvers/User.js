const User = {
    posts: (parent, __, { userInfo, prisma }) => {
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
    profile: (parent, __, { prisma }) => {
        return prisma.profile.findUnique({
            where: {
                user_id: parent.id
            }
        })
    }
}

export { User }