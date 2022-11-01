import {pubsub} from "../../index.js"

export const messageResolvers = {
    createMessage: async ( _, {messageInput: {text, username}}, { prisma } ) => {
        const res = await prisma.messages.create({
            data: {
                text,
                createdBy: username
            }
        })

        await pubsub.publish('MESSAGE_CREATED', {
            messageCreated: {
                text,
                createdBy: username
            }
        })

        return {
            id: res.id,
            ...res
        }
    },
}