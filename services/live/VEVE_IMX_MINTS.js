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
                    pageSize: 500, // 2673 is max?
                    txnType: "mint"
                }
            })
        })
            .then(imxMints => imxMints.json())
            .then(async imxMints => {

                let imxMintsArr = []
                let imxTokenArr = []
                let imxWalletIds = []

                await imxMints.data.listTransactionsV2.items.map(async (mint) => {

                    imxMintsArr.push({
                        id: mint.txn_id,
                        wallet_id: mint.transfers[0].to_address,
                        timestamp: moment.unix(mint.txn_time / 1000).format(),
                        token_id: Number(mint.transfers[0].token.token_id)
                    })

                    imxTokenArr.push({token_id: Number(mint.transfers[0].token.token_id), mint_date: moment.unix(mint.txn_time / 1000).format()})
                    imxWalletIds.push({id: mint.transfers[0].to_address})

                })

                try {

                    await prisma.veve_mints.createMany({
                        data: imxMintsArr,
                        skipDuplicates: true
                    })

                    await prisma.veve_wallets.createMany({
                        data: imxWalletIds,
                        skipDuplicates:true
                    })

                    await prisma.veve_tokens.createMany({
                        data: imxTokenArr,
                        skipDuplicates: true
                    })

                } catch (e) {
                    console.log('fail clown: ', e)
                }

            })
            .catch(e => console.log('[ERROR] VEVE_IMX_MINTS: ', e))


    } catch (e) {
        console.log('[ERROR] VEVE_IMX_MINTS: ', e)
    }

}