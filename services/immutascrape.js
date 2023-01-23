import fetch from 'node-fetch'
import HttpsProxyAgent from "https-proxy-agent"
import moment from 'moment'

import Twit from 'twit'

const T = new Twit({
    consumer_key:         process.env.TWITTER_API_KEY,
    consumer_secret:      process.env.TWITTER_API_SECRET,
    access_token:         process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

// Setup proxy
const proxy_string = process.env.PROXY
const proxy_parts = proxy_string.split(':')
const ip_address = proxy_parts[0]
const port = proxy_parts[1]
const username = proxy_parts[2]
const password = proxy_parts[3]

const proxyAgent = new HttpsProxyAgent(`http://${username}:${password}@${ip_address}:${port}`)

const getImxTransactions = () => (`query listTransactionsV2($address: String!, $pageSize: Int, $nextToken: String, $txnType: String, $maxTime: Float) {
  listTransactionsV2(
    address: $address
    limit: $pageSize
    nextToken: $nextToken
    txnType: $txnType
    maxTime: $maxTime
  ) {
    items {
      txn_time
      txn_id
      txn_type
      transfers {
        from_address
        to_address
        token {
          type
          quantity
          usd_rate
          token_address
          token_id
        }
      }
    }
    nextToken
    lastUpdated
    txnType
    maxTime
    scannedCount
  }
}`)

export const Immutascrape = () => {
    try {
        fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                "x-api-key": process.env.IMX_API
            },
            body: JSON.stringify({
                query: getImxTransactions(),
                variables: {
                    address: "0xa7aefead2f25972d80516628417ac46b3f2604af",
                    pageSize: 30, // 2673 is max?
                    txnType: "transfer"
                }
            })
        })
            .then(imxTransactions => imxTransactions.json())
            .then(async imxTransactions => {

                const nextToken = imxTransactions.data.listTransactionsV2.nextToken

                let imxTransArr = []
                await imxTransactions.data.listTransactionsV2.items.map((transaction) => {

                    const alertTweet = ``
                    T.post('statuses/update', {status: alertTweet}, (err, data, response) => {
                        if (!err) console.log('Twitter notification sent to user.')
                    })

                    const imxTransObj = {
                        id: transaction.txn_id.toString(),
                        from_user: transaction.transfers[0].from_address,
                        to_user: transaction.transfers[0].to_address,
                        timestamp: moment.unix(transaction.txn_time/1000).format(),
                        token_id: Number(transaction.transfers[0].token.token_id)
                    }

                    imxTransArr.push(imxTransObj)

                    // Check if transactions already exist

                    // Push transactions into the database
                    // try {
                    //     const upsertTokens = await prisma.clown_transfers.upsert({
                    //         where: {
                    //             id: transaction.txn_id.toString()
                    //         },
                    //         update: {},
                    //         create: {
                    //             id: transaction.txn_id.toString(),
                    //             from_user: transaction.transfers[0].from_address,
                    //             to_user: transaction.transfers[0].to_address,
                    //             timestamp: moment.unix(transaction.txn_time/1000).format(),
                    //             token: {
                    //                 connectOrCreate: {
                    //                     where: { token_id: Number(transaction.transfers[0].token.token_id) },
                    //                     create: {
                    //                         token_id: Number(transaction.transfers[0].token.token_id),
                    //                         toProcess: true
                    //                     },
                    //                 }
                    //             }
                    //         }
                    //     })
                    //
                    //     // Notify pubsub of updates
                    //     console.log('upsertTokens is: ', upsertTokens)
                    //
                    // } catch (e) {
                    //     console.log('clown fail: ', e)
                    // }

                })

                // Send imxTransArr to gql mutation (createTransfer)
                try {
                    // console.log('Sending: ', imxTransArr)
                    await fetch(`http://localhost:4007/graphql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            query: `mutation($transferInput: [VeveTransferInput]) { createVeveTransfer(transferInput: $transferInput) }`,
                            variables:{
                                "transferInput": imxTransArr
                            }
                        })
                    })
                        .then(data => data.json())
                        .then(data => {
                            // console.log('Mutation res is: ', data)
                        })
                        .catch(error => console.log('[ERROR] Mutation did not like transfers. ', error))
                } catch (e) {
                    console.log('[ERROR] Unable to send transactions through mutation. ', e)
                }

                // try {
                //     const saveImxTransactions = await prisma.clown_transfers.createMany({
                //         data: imxTransArr,
                //         skipDuplicates: true
                //     })
                //
                //     if (saveImxTransactions.count > 0){
                //         const transfers = await prisma.clown_transfers.findMany()
                //         console.log('ALERTING PUBSUB')
                //         await pubsub.publish('VEVE_IMX_TRANSFERS_UPDATED', {
                //             imxVeveTransfersUpdated: transfers
                //         })
                //     }
                //
                // }catch (e) {
                //     console.log('fail clown: ', e)
                // }


            })
            .catch(error => console.log('[ERROR] Unable to fetch IMX transactions.', error))

    } catch (e){
        console.log('[ERROR] Immutascrape: ', e)
    }

}