import { postResolvers } from "./Post.js"
import { authResolvers } from "./Auth.js"
import { messageResolvers } from "./Message.js"
import { commentResolvers } from "./Comment.js"

const Mutation = {
    ...authResolvers,
    ...postResolvers,
    ...commentResolvers,
    ...messageResolvers
}

export { Mutation }