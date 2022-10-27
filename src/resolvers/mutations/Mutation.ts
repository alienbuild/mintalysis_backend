import { Context } from '../../index'
import { postResolvers } from "./post"
import { authResolvers } from "./auth"

export const Mutation = {
    ...postResolvers,
    ...authResolvers
}