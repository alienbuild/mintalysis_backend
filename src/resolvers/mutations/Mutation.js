import { postResolvers } from "./Post.js"
import { authResolvers } from "./Auth.js"
import { messageResolvers } from "./Message.js"
import { commentResolvers } from "./Comment.js"
import { userResolvers } from "./User.js"
import { fileUploadResolvers } from "./FileUpload.js"

const Mutation = {
    ...authResolvers,
    ...userResolvers,
    ...fileUploadResolvers,
    ...postResolvers,
    ...commentResolvers,
    ...messageResolvers
}

export { Mutation }