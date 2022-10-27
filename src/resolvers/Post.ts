import { Context } from '../index'
import { userLoader } from "../loaders/userLoaders"

interface PostParentType {
    author_id: number
    bio: string
    user_id: number
}

export const Post = {
    user: (parent: PostParentType, __: any, { prisma }: Context) => {
        return userLoader.load(parent.author_id)
    },
}