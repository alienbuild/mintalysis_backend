import {pubsub} from "../index.js";

const Subscription = {
    messageCreated: {
        subscribe: (_, __, ___) => pubsub.asyncIterator('MESSAGE_CREATED')
    }
}

export { Subscription }