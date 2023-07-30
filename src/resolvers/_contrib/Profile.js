const Profile ={
    user: (parent, __, { userInfo, prisma }) => {
        return prisma.User.findUnique({
            where: {
                id: parent.user_id
            }
        })
    },
}

export { Profile }