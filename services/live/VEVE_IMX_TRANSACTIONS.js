import fetch from 'node-fetch'
import HttpsProxyAgent from "https-proxy-agent"
import moment from 'moment'
import {setTimeout} from "node:timers/promises";

import Twit from 'twit'
import {prisma, pubsub} from "../../src/index.js"

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

export const VEVE_IMX_TRANSACTIONS = () => {
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
                    pageSize: 2673, // 2673 is max?
                    txnType: "transfer"
                }
            })
        })
            .then(imxTransactions => imxTransactions.json())
            .then(async imxTransactions => {

                const nextToken = imxTransactions.data.listTransactionsV2.nextToken

                const previousWalletCount = await prisma.veve_wallets.count()
                let imxTransArr = []
                let imxWalletIds = []

                await imxTransactions.data.listTransactionsV2.items.map(async (transaction, index) => {

                    // Max 5 calls a sec on public rest api
                    // await setTimeout(index*200)

                    let token_id =Number(transaction.transfers[0].token.token_id)
                    let timestamp = moment.unix(Number(transaction.txn_time) / 1000).utc().format()
                    let from_wallet = transaction.transfers[0].from_address
                    let to_wallet = transaction.transfers[0].to_address
                    let active = 1

                    imxTransArr.push({
                        id: txn_id,
                        from_wallet: from_wallet,
                        to_wallet: to_wallet,
                        timestamp: timestamp,
                        token_id: token_id
                    })

                    //no way for from_wallet to be a brand new wallet
                    imxWalletIds.push({
                        id: from_wallet, 
                        last_activity_date: timestamp, 
                        active: active
                    })

                    imxWalletIds.push({
                        id: to_wallet, 
                        last_activity_date: timestamp, 
                        active: active
                    })

                    let updateObj = {
                        token_id: token_id,
                        wallet_id: to_wallet,
                        mint_date: timestamp
                    }

                    try {

                        await prisma.veve_tokens.upsert({
                            where: {
                                token_id: token_id
                            },
                            update:{
                                wallet_id: to_wallet
                            },
                            create: updateObj
                        })

                    } catch(err) {
                        console.log(`[ERROR] Unable to upsert ${token_id} : `, err )
                    }

                })

                const previousTransactionCount = await prisma.veve_transfers.count()

                try {

                    imxWalletIds.map(async wallet => {
                        prisma.veve_wallets.upsert({
                            where: {
                                id: wallet
                            },
                            update: imxWalletIds,
                            create: imxWalletIds
                        });
                    })

                    await prisma.veve_transfers.createMany({
                        data: imxTransArr,
                        skipDuplicates: true
                    })

                    await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                        createVeveTransfer: imxTransArr
                    })

                    await pubsub.publish('IMX_VEVE_TRANSFERS_UPDATED', {
                        imxVeveTxnsUpdated: imxTransArr
                    })

                    const currentTransactionCount = await prisma.veve_transfers.count()
                    if (currentTransactionCount > previousTransactionCount) {
                        const imxStats = await prisma.imx_stats.update({
                            where: {
                                project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d"
                            }, data: {
                                transaction_count: currentTransactionCount
                            }
                        })
                        await pubsub.publish('IMX_VEVE_TXN_STATS_UPDATED', {
                            imxVeveStatsUpdated: imxStats
                        })
                    }

                    const currentWalletCount = await prisma.veve_wallets.count()
                    if (currentWalletCount > previousWalletCount) {
                        const imxStats = await prisma.imx_stats.update({
                            where: {
                                project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d"
                            }, data: {
                                wallet_count: currentWalletCount
                            }
                        })
                        await pubsub.publish('IMX_VEVE_WALLET_STATS_UPDATED', {
                            imxVeveStatsUpdated: imxStats
                        })
                    }  

                } catch (e) {
                    console.log('[ERROR] Unable to send transactions: ', e)
                }

            })
            .catch(error => console.log('[ERROR] Unable to fetch IMX transactions.', error))

            // let metadata

                                // try {
                                //     const checkMetaData = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${transaction.transfers[0].token.token_id}`)
                                //     metadata = await checkMetaData.json()
                                // } catch (e) {
                                // }

                                // if (metadata && metadata.name){
                                //     updateObj.mint_date = metadata.created_at
                                //     if (metadata && metadata.metadata.editionType){
                                //         let collectibleId = metadata.image_url.split('.')
                                //         updateObj.edition = metadata.metadata.edition
                                //         updateObj.rarity = metadata.metadata.rarity
                                //         updateObj.collectible_id = collectibleId[3]
                                //         updateObj.type = 'collectible'
                                //     } else {
                                //         try {
                                //             const uniqueCoverId = await prisma.veve_comics.findFirst({
                                //                 where: {
                                //                     image_full_resolution_url: metadata.image_url
                                //                 },
                                //                 select: {
                                //                     unique_cover_id: true
                                //                 }
                                //             })
                                //             if (uniqueCoverId){
                                //                 updateObj.unique_cover_id = uniqueCoverId.unique_cover_id
                                //                 updateObj.edition = metadata.metadata.edition
                                //                 updateObj.rarity = metadata.metadata.rarity
                                //                 updateObj.type = 'comic'
                                //             }
                                //         } catch (e) {
                                //             console.log('[ERROR] could not look up comic ', e)
                                //         }
                                //     }
                                // }

    } catch (e){
        console.log('[ERROR] VEVE_IMX_TRANSACTIONS: ', e)
    }

}