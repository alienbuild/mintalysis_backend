import {userLoader} from "../loaders/userLoader.js"

const Post = {
    user: (parent, __, { prisma }) => {
        return userLoader.load(parent.author_id)
    },
}

export { Post }