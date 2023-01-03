const Profile ={
    user: (parent, __, { userInfo, prisma }) => {
        return prisma.users.findUnique({
            where: {
                id: parent.user_id
            }
        })
    },
}

export { Profile }