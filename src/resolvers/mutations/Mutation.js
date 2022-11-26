import { postResolvers } from "./Post.js"
import { authResolvers } from "./Auth.js"
import { messageResolvers } from "./Message.js"
import { commentResolvers } from "./Comment.js"
import { userResolvers } from "./User.js"
import { fileUploadResolvers } from "./FileUpload.js"
import { veveVaultResolvers } from './VeveVault.js'
import { veveTransferResolvers } from "./VeveTransfer.js"

const Mutation = {
    ...authResolvers,
    ...userResolvers,
    ...veveVaultResolvers,
    ...veveTransferResolvers,
    ...fileUploadResolvers,
    ...postResolvers,
    ...commentResolvers,
    ...messageResolvers
}

export { Mutation }