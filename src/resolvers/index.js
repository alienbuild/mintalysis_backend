import merge from 'lodash.merge'
import * as DateTime from './DateTime.js'
import authResolvers from './auth.js'
import userResolvers from './user.js'
import projectResolvers from './projects.js'
import transferResolvers from './transfers.js'
import conversationResolvers from './conversations.js'
import messageResolvers from './message.js'
import veveResolvers from './veve.js'
import characterResolvers from './characters.js'
import artistResolvers from './artists.js'
import writerResolvers from './writers.js'
import ecologiResolvers from './ecologi.js'
import immutablexResolvers from './immutablex.js'
import communityResolvers from './community.js'
// import pokerResolvers from './poker.js'
import uptimeResolvers from './uptime.js'
import marketplaceResolvers from './marketplace.js'
import notificationResolvers from './notifications.js'
import articleResolvers from './articles.js'
import feedbackResolvers from './feedback.js'
import mintsyncResolvers from './mintsync.js'
import triggerResolvers from './triggers.js'
import newsletterResolvers from './newsletters.js'
import searchResolvers from './search.js'
import blockchainResolvers from './blockchain.js'

const resolvers = merge({},
    DateTime,
    authResolvers,
    userResolvers,
    projectResolvers,
    transferResolvers,
    conversationResolvers,
    messageResolvers,
    veveResolvers,
    characterResolvers,
    artistResolvers,
    writerResolvers,
    ecologiResolvers,
    immutablexResolvers,
    communityResolvers,
    // pokerResolvers,
    uptimeResolvers,
    marketplaceResolvers,
    notificationResolvers,
    articleResolvers,
    feedbackResolvers,
    mintsyncResolvers,
    triggerResolvers,
    newsletterResolvers,
    searchResolvers,
    blockchainResolvers
)

export default resolvers