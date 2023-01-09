import {encodeCursor} from "../utils/index.js"

const resolvers = {
    Query: {
        transfers: async (_, {token_id, limit = 10}, { prisma }) => {
            let queryParams = { take: limit }
            let transfers
            if (token_id){
                transfers = await prisma.clown_transfers.findMany({
                    where: {
                        token_id: token_id
                    }
                })
            } else {
                transfers = await prisma.clown_transfers.findMany(queryParams)
            }

            return {
                edges: transfers,
                pageInfo: {
                    endCursor: transfers.length > 1 ? encodeCursor(String(transfers[transfers.length - 1].token_id)) : null
                }
            }
        },
    },
    Mutation: {
        createVeveTransfer: async (_, { transferInput: imxTransArr }, { prisma, pubsub }) => {

            let sendBkArray = []
            await imxTransArr.map(async (transfer, index) => {

                sendBkArray.push(transfer)
                // const saveImxTransactions = await prisma.clown_transfers.createMany({
                //     data: transfer,
                //     skipDuplicates: true
                // })

                // console.log('saveImxTransactions is: ', saveImxTransactions)

                // if (saveImxTransactions.count > 0){
                //     console.log('Saved more than 0 tokens.')
                //     setTimeout(async () => {
                // try {
                //     setImmediate(async () => {
                //         await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                //             createVeveTransfer: transfer
                //         })
                //     })
                //
                // } catch (e) {
                //     console.log('Nah nobody was alerted.')
                // }

                //     }, 1000)
                // } else {
                //     console.log('Nah didnt save any mate.')
                // }

                // try {
                //     // console.log('transfer is: ', transfer)
                //
                //     // await fetch(`http://localhost:4000/graphql`, {
                //     //     method: 'POST',
                //     //     headers: {
                //     //         'Content-Type': 'application/json',
                //     //         'Accept': 'application/json',
                //     //     },
                //     //     body: JSON.stringify({
                //     //         query: `query($transfersId: ID){ transfers(id: $transfersId) { edges { id, from_user, to_user, timestamp } } }`,
                //     //         variables:{
                //     //             "transfersId": token_id
                //     //         }
                //     //     })
                //     // })
                //     //     .then(res => res.json())
                //     //     .then(async res => {
                //     //         console.log('res is: ', res.data.transfers.edges[0])
                //     //     })
                //     //     .catch(e => console.log('[ERROR] Unable to query transfers: ', e))
                //
                // } catch (e) {
                //     console.log('NOPE! ', e)
                // }

            })

            await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                createVeveTransfer: sendBkArray
            })

            return true
        }
    },
    Subscription: {
        createVeveTransfer: {
            subscribe: (_, __, ___, info) => {
                return pubsub.asyncIterator('VEVE_IMX_TRANSFER_CREATED')
            }
        }
    }
}

export default resolvers