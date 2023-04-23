import fetch from "node-fetch"

import Twit from 'twit'
import { prisma } from "../../src/index.js"
import HttpsProxyAgent from "https-proxy-agent"
import moment from "moment";

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

const getImxMints = () => (`query listTransactionsV2($address: String!, $pageSize: Int, $nextToken: String, $txnType: String, $maxTime: Float) {
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

export const VEVE_IMX_MINTS = () => {

    try {
        fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                "x-api-key": process.env.IMX_API
            },
            body: JSON.stringify({
                query: getImxMints(),
                variables: {
                    address: "0xa7aefead2f25972d80516628417ac46b3f2604af",
                    pageSize: 2673, // 2673 is max?
                    txnType: "mint"
                }
            })
        })
            .then(imxMints => imxMints.json())
            .then(async imxMints => {

                let imxMintsArr = []
                let imxTokenArr = []
                let imxWalletIdsNew = []
                let imxWalletIdsUpdate = []

                const previousWalletCount = await prisma.veve_wallets.count()
                const previousMintCount = await prisma.veve_mints.count()

                await imxMints.data.listTransactionsV2.items.map(async (mint) => {
                    
                    let token_id = Number(mint.transfers[0].token.token_id)
                    let timestamp = moment.unix(Number(mint.txn_time) / 1000).utc().format()
                    let wallet_id = mint.transfers[0].to_address
                    let active = 1

                    imxMintsArr.push({
                        id: mint.txn_id,
                        wallet_id: wallet_id,
                        timestamp: timestamp,
                        token_id: token_id
                    })

                    imxTokenArr.push({
                        token_id: token_id, 
                        mint_date: mint_date, 
                        wallet_id: wallet_id
                    })

                    imxWalletIdsNew.push({
                        id: wallet_id, 
                        active: active, 
                        first_activity_date: timestamp,
                        last_activity_date: timestamp
                    })

                    imxWalletIdsUpdate.push({ 
                        id: wallet_id,
                        active: active, 
                        last_activity_date: timestamp
                    })

                    // try {
                    //     await prisma.veve_wallets.upsert({
                    //         where: {
                    //             id: wallet_id
                    //         },
                    //         update:{
                    //             active: active, 
                    //             last_activity_date: timestamp
                    //         },
                    //         create: {
                    //             id: wallet_id, 
                    //             active: active, 
                    //             first_activity_date: timestamp, 
                    //             last_activity_date: timestamp
                    //         }
                    //     })

                    // } catch(err) {
                    //     console.log(`[ERROR] Unable to upsert ${wallet_id} to veve_wallets: `, err )
                    // }


                })
                
                try {

                    await prisma.veve_mints.createMany({
                        data: imxMintsArr,
                        skipDuplicates: true
                    })


                    await prisma.$transaction(
                        ??.map((mint =>
                            prisma.veve_wallets.upsert({
                                where: { 
                                    id: mint.wallet_id 
                                },
                                update: imxWalletIdsUpdate,
                                create: imxWalletIdsNew
                            })
                        ))
                    );

                    //await prisma.veve_wallets.createMany({
                    //    data: imxWalletIds,
                    //    skipDuplicates:true
                    //})

                    await prisma.veve_tokens.createMany({
                        data: imxTokenArr,
                        skipDuplicates: true
                    })

                    const currentMintCount = await prisma.veve_mints.count()
                    if (currentMintCount > previousMintCount) {
                        const imxStats = await prisma.imx_stats.update({
                            where: {
                                project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d"
                            }, data: {
                                token_count: currentMintCount
                            }
                        })
                        await pubsub.publish('IMX_VEVE_MINT_STATS_UPDATED', {
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
                    console.log('[ERROR] Unable to send mints: ', e)
                }

            })
            .catch(e => console.log('[ERROR] Unable to fetch IMX Mints:', e))


    } catch (e) {
        console.log('[ERROR] VEVE_IMX_MINTS: ', e)
    }

}