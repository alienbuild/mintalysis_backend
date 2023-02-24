import {encodeCursor} from "../utils/index.js"

const resolvers = {
    Query: {
    },
    Mutation: {
        createVeveTransfer: async (_, { transferInput: imxTransArr }, { prisma, pubsub }) => {
            // let sendBkArray = []
            // await imxTransArr.map(async (transfer, index) => {
            //     sendBkArray.push(transfer)
            // })

            // const currentTransactionCount = await prisma.veve_transfers.count()
            // if (currentTransactionCount > previousTransactionCount) {
            //     const test = await prisma.imx_stats.update({
            //         where: {
            //             project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d"
            //         }, data: {
            //             transaction_count: currentTransactionCount
            //         }
            //     })
            //     console.log('test is: ', test)
            //     await pubsub.publish('IMX_VEVE_STATS_UPDATED', test)
            // }

            await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                createVeveTransfer: imxTransArr
            })

            return true
        }
    },
    Subscription: {
        createVeveTransfer: {
            subscribe: (_, __, { pubsub }) => {
                return pubsub.asyncIterator('VEVE_IMX_TRANSFER_CREATED')
            }
        }
    },
}

export default resolvers