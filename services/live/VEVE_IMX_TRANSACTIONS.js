import fetch from 'node-fetch'
import HttpsProxyAgent from "https-proxy-agent"
import moment from 'moment'
import {setTimeout} from "node:timers/promises";

import Twit from 'twit'
import {prisma} from "../../src/index.js"

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
                    pageSize: 40, // 2673 is max?
                    txnType: "transfer"
                }
            })
        })
            .then(imxTransactions => imxTransactions.json())
            .then(async imxTransactions => {

                const nextToken = imxTransactions.data.listTransactionsV2.nextToken

                let imxTransArr = []
                let imxTokenArr = []
                let imxWalletIds = []

                await imxTransactions.data.listTransactionsV2.items.map(async (transaction, index) => {

                    await setTimeout(Math.floor(Math.random() * 2000) + index * 1000 / 3)

                    try {

                        imxTransArr.push({
                            id: transaction.txn_id,
                            from_wallet: transaction.transfers[0].from_address,
                            to_wallet: transaction.transfers[0].to_address,
                            timestamp: moment.unix(Number(transaction.txn_time) / 1000).format(),
                            token_id: Number(transaction.transfers[0].token.token_id)
                        })

                        imxTokenArr.push({token_id: Number(transaction.transfers[0].token.token_id)})
                        imxWalletIds.push({id: transaction.transfers[0].to_address })
                        imxWalletIds.push({id: transaction.transfers[0].from_address })

                        const checkMetaData = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${transaction.transfers[0].token.token_id}`)
                        const metadata = await checkMetaData.json()

                        let updateObj = {
                            token_id: Number(transaction.transfers[0].token.token_id),
                            wallet_id: transaction.transfers[0].to_address,
                        }
                        if (metadata && metadata.name){
                            updateObj.mint_date = metadata.created_at
                            if (metadata && metadata.metadata.editionType){
                                let collectibleId = metadata.image_url.split('.')
                                updateObj.edition = metadata.metadata.edition
                                updateObj.collectible_id = collectibleId[3]
                                updateObj.type = 'collectible'
                            } else {
                                try {
                                    const uniqueCoverId = await prisma.veve_comics.findFirst({
                                        where: {
                                            image_full_resolution_url: metadata.image_url
                                        },
                                        select: {
                                            unique_cover_id: true
                                        }
                                    })
                                    if (uniqueCoverId){
                                        updateObj.unique_cover_id = uniqueCoverId.unique_cover_id
                                        updateObj.edition = metadata.metadata.edition
                                        updateObj.type = 'comic'
                                    }
                                } catch (e) {
                                    console.log('[ERROR] could not look up comic ', e)
                                }
                            }
                        }

                        await prisma.veve_tokens.upsert({
                            where: {
                                token_id: Number(transaction.transfers[0].token.token_id)
                            },
                            update:{
                                wallet_id: transaction.transfers[0].to_address
                            },
                            create: updateObj
                        })

                    } catch(err) {
                        console.log('[ERROR] Unable to check metadata for : ', transaction.transfers[0].token.token_id)
                    }

                })

                try {
                    await prisma.veve_transfers.createMany({
                        data: imxTransArr,
                        skipDuplicates: true
                    })

                    await prisma.veve_wallets.createMany({
                        data: imxWalletIds,
                        skipDuplicates:true
                    })

                }catch (e) {
                    console.log('fail clown: ', e)
                }

                try {
                    await fetch(`http://localhost:8001/graphql`, {
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

            })
            .catch(error => console.log('[ERROR] Unable to fetch IMX transactions.', error))

    } catch (e){
        console.log('[ERROR] VEVE_IMX_TRANSACTIONS: ', e)
    }

}

VEVE_IMX_TRANSACTIONS()