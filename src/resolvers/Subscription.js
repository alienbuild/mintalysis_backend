import {pubsub} from "../index.js"

const Subscription = {
    messageCreated: {
        subscribe: (_, __, ___) => pubsub.asyncIterator('MESSAGE_CREATED')
    },
    imxVeveTransfersUpdated: {
        subscribe: (_, __, ___) => pubsub.asyncIterator('VEVE_IMX_TRANSFERS_UPDATED')
    }
}

export { Subscription }