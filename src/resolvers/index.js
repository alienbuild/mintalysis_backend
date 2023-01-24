import merge from 'lodash.merge'
import * as DateTime from './DateTime.js'
import authResolvers from './auth.js'
import userResolvers from './user.js'
import projectResolvers from './projects.js'
import tokenResolvers from './tokens.js'
import transferResolvers from './transfers.js'
import comicResolvers from './comics.js'
import conversationResolvers from './conversations.js'
import messageResolvers from './message.js'
import veveResolvers from './veve.js'

const resolvers = merge({},
    DateTime,
    authResolvers,
    userResolvers,
    projectResolvers,
    tokenResolvers,
    transferResolvers,
    comicResolvers,
    conversationResolvers,
    messageResolvers,
    veveResolvers
)

export default resolvers