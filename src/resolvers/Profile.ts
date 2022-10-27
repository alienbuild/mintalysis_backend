import { Context } from '../index'

interface ProfileParentType {
    id: number
    bio: string
    user_id: number
}

export const Profile ={
    user: (parent: ProfileParentType, __: any, { userInfo, prisma }: Context) => {
        return prisma.users.findUnique({
            where: {
                id: parent.user_id
            }
        })
    },
}