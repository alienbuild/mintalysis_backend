import {prisma, pubsub} from "../index.js"

const Subscription = {
    messageCreated: {
        subscribe: (_, __, ___) => pubsub.asyncIterator('MESSAGE_CREATED')
    },
    createVeveTransfer: {
        subscribe: (_, __, ___, info) => {
             return pubsub.asyncIterator('VEVE_IMX_TRANSFER_CREATED')
        }
    }
}

export { Subscription }