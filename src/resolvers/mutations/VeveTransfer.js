import { pubsub } from "../../index.js"

export const veveTransferResolvers = {
    createVeveTransfer: async (_, { transferInput: imxTransArr }, { prisma }) => {

        console.log('[RECIVED] IMX Txns total: ', imxTransArr.length)
        await imxTransArr.map(async (transfer, index) => {

            const saveImxTransactions = await prisma.clown_transfers.createMany({
                data: transfer,
                skipDuplicates: true
            })

            console.log('saveImxTransactions is: ', saveImxTransactions)

            // if (saveImxTransactions.count > 0){
            //     console.log('Saved more than 0 tokens.')
            //     setTimeout(async () => {
                    console.log('[ALERTED SUBSCRIBERS]') 
                    await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                        createVeveTransfer: transfer
                    })
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

        return true
    }
}