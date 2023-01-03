import merge from 'lodash.merge'
import * as DateTime from './DateTime.js'
import authResolvers from './auth.js'
import userResolvers from './user.js'
import projectResolvers from './projects.js'
import tokenResolvers from './tokens.js'
import transferResolvers from './transfers.js'
import collectibleResolvers from './collectibles.js'
import comicResolvers from './comics.js'
import conversationResolvers from './conversations.js'

const resolvers = merge({},
    DateTime,
    authResolvers,
    userResolvers,
    projectResolvers,
    tokenResolvers,
    transferResolvers,
    collectibleResolvers,
    comicResolvers,
    conversationResolvers
)

export default resolvers