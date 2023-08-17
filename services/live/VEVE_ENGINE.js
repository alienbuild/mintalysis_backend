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

const getImxTransactions = () => (`query listTransactionsV2($address: String!, $pageSize: Int, $txnType: String, $nextToken: String, $maxTime: Float) {
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
          token_detail {
            name
            image_url
          }
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


// THIS WILL UPDATE MINTS, TRANSFERS, WALLETS, AND TOKENS
// IT WILL ALSO UPDATE THE IMX_STATS TABLE
// IT WILL ALSO PUBLISH TO THE SUBSCRIPTIONS FOR EACH TABLE AND FOR THE IMX_STATS TABLE
// 
async function fetchIMXTransactions(nextToken) {
    console.log('[INFO] Fetching IMX transactions...')
    try {
        const response = await fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
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
                    pageSize: 1000, // 2673 is max?
                    nextToken: nextToken
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Unable to fetch IMX transactions. Status: ${response.status}`);
        }

        const imxTransactions = await response.json();
        console.log('[INFO] Fetched IMX transactions successfully.');
        return imxTransactions.data.listTransactionsV2;

    } catch (e) {
        console.log('[ERROR] Unable to fetch IMX transactions.', e);
        throw e;
    }
}

async function processIMXTransactions(transactions) {
    let VEVE = "de2180a8-4e26-402a-aed1-a09a51e6e33d"
    let imxMintsArr = [];
    let imxTransArr = [];
    let imxWalletsArr = [];
    let imxTokensArr = [];

    for (const transaction of transactions.items) {
        // console.log(transaction.transfers.token.token_detail)

        let timestamp = moment.unix(Number(transaction.txn_time) / 1000).utc().format()
        let txn_id = transaction.txn_id
        let txn_type = transaction.txn_type
        let from_wallet = transaction.transfers[0].from_address
        let to_wallet = transaction.transfers[0].to_address
        let token_id = Number(transaction.transfers[0].token.token_id)
        let image_url = transaction.transfers[0]?.token?.token_detail?.image_url || null;
        // let name = transaction.transfers[0].token.token_detail.name

        let unique_cover_id = null
        let collectible_id = null

        try {
            const reComic = /comic_cover\.([a-f\d-]+)\./;
            const reCollectible = /collectible_type_image\.([a-f\d-]+)\./;
    
            if (image_url && image_url.length > 0) {
                const comicMatch = image_url.match(reComic);
                const collectibleMatch = image_url.match(reCollectible);
                
                if (comicMatch) {
                    unique_cover_id = comicMatch[1];
                } else if (collectibleMatch) {
                    collectible_id = collectibleMatch[1];
                }
            }
        } catch (e) {
            console.log(`[ERROR] Unable to extract id from image_url for token: ${token_id} => `, e);
        }

        if (txn_type === "mint") {
            imxMintsArr.push({
                id: txn_id,
                wallet_id: to_wallet,
                timestamp: timestamp,
                token_id: token_id
            });

            imxWalletsArr.push({
                id: to_wallet, 
                first_activity_date: timestamp,
                last_activity_date: timestamp, 
                active: true // if wallet is active since 8/1/2022
            })

        } else if (txn_type === "transfer") {
            imxTransArr.push({
                id: txn_id,
                from_wallet: from_wallet,
                to_wallet: to_wallet,
                timestamp: timestamp,
                token_id: token_id
            });

            imxWalletsArr.push({
                id: from_wallet, 
                last_activity_date: timestamp, 
                active: true, // if wallet is active since 8/1/2022
                KYC: true // if wallet sold something = Has KYC after ~6/1/2023
            })

            imxWalletsArr.push({
                id: to_wallet, 
                first_activity_date: timestamp,
                last_activity_date: timestamp, 
                active: true // if wallet is active since 8/1/2022
            })
        }

        imxTokensArr.push({
            token_id: token_id,
            wallet_id: to_wallet,
            txn_type: txn_type,
            mint_date: timestamp,
            unique_cover_id: unique_cover_id || null,
            collectible_id: collectible_id || null
        });
    }
        
        const previousMintCount = await prisma.veve_mints.count()
        const previousTransferCount = await prisma.veve_transfers.count()
        const previousWalletCount = await prisma.veve_wallets.count()
        const previousTokenCount = await prisma.veve_tokens.count()
    
        try {
            await prisma.veve_mints.createMany({
                data: imxMintsArr,
                skipDuplicates: true
            })

            await pubsub.publish('VEVE_IMX_MINT_CREATED', {
                createVeveMint: imxMintsArr
            })

            await prisma.veve_transfers.createMany({
                data: imxTransArr,
                skipDuplicates: true
            })

            await pubsub.publish('VEVE_IMX_TRANSFER_CREATED', {
                createVeveTransfer: imxTransArr
            })

            // console.log('[INFO] Upserting wallets: ', imxWalletsArr);
            await Promise.all(imxWalletsArr.map(async (wallet) => {
                // console.log('[INFO] Upserting wallet: ', wallet);
            
                const existingWallet = await prisma.veve_wallets.findUnique({
                    where: {
                        id: wallet.id
                    }
                });
            
                const upsertParams = {
                    where: {
                        id: wallet.id
                    },
                    update: {
                        last_activity_date: wallet.last_activity_date > existingWallet?.last_activity_date
                            ? wallet.last_activity_date
                            : existingWallet?.last_activity_date,
                        first_activity_date: existingWallet ? existingWallet.first_activity_date : wallet.last_activity_date,
                        KYC: wallet.KYC,
                        active: wallet.active // Update other fields as needed
                    },
                    create: {
                        ...wallet,
                        first_activity_date: wallet.last_activity_date
                    }
                };
            
                if (existingWallet) {
                    // Update first_activity_date only if it's earlier than what's in the table
                    if (wallet.first_activity_date < existingWallet.first_activity_date) {
                        upsertParams.update.first_activity_date = wallet.first_activity_date;
                    } else {
                        delete upsertParams.update.first_activity_date;
                    }
                }
            
                await prisma.veve_wallets.upsert(upsertParams);
            }));

            await Promise.all(imxTokensArr.map(async (token) => {
                try {
                    // Remove the txn_type field from the token object
                    const { txn_type, ...tokenWithoutTxnType } = token;
            
                    const existingToken = await prisma.veve_tokens.findFirst({
                        where: {
                            token_id: token.token_id
                        },
                        orderBy: {
                            mint_date: 'desc'
                        }
                    });
            
                    if (existingToken) {
                        const updateFields = {
                            wallet_id: token.wallet_id
                        };
            
                        if (txn_type === 'mint') {
                            updateFields.mint_date = token.mint_date;
                        }
            
                        // console.log('[INFO] Upserting token: ', token);
                        await prisma.veve_tokens.upsert({
                            where: {
                                token_id: token.token_id
                            },
                            update: updateFields,
                            create: {
                                token_id: token.token_id,
                                wallet_id: token.wallet_id,
                                mint_date: token.mint_date,
                                unique_cover_id: token.unique_cover_id || null,
                                collectible_id: token.collectible_id || null
                            }
                        });
                    } else {
                        // console.log('[INFO] Inserting new token: ', token);
                        await prisma.veve_tokens.create({
                            data: tokenWithoutTxnType
                        });
                    }
                } catch (error) {
                    console.error('[ERROR] Failed to upsert token:', error);
                }
            }));            
            
            await pubsub.publish('VEVE_IMX_TOKEN_CREATED', {
                createVeveToken: imxTokensArr
            })
            
            const currentMintCount = await prisma.veve_mints.count()
            let new_mints = currentMintCount - previousMintCount
            if (currentMintCount >= previousMintCount) {
                const imxStats = await prisma.imx_stats.update({
                    where: {
                        project_id: VEVE
                    }, data: {
                        token_count: currentMintCount
                    }
                })
                await pubsub.publish('IMX_VEVE_MINT_STATS_UPDATED', {
                    imxVeveStatsUpdated: imxStats
                })
                console.log(`[INFO] ${new_mints} new mints`)
            }    

            const currentTransferCount = await prisma.veve_transfers.count()
            let new_transfers = currentTransferCount - previousTransferCount
            if (currentTransferCount >= previousTransferCount) {
                const imxStats = await prisma.imx_stats.update({
                    where: {
                        project_id: VEVE
                    }, data: {
                        transaction_count: currentTransferCount
                    }
                })
                await pubsub.publish('IMX_VEVE_TRANSFER_STATS_UPDATED', {
                    imxVeveStatsUpdated: imxStats
                })
                console.log(`[INFO] ${new_transfers} new transfers`)
            }   

            const currentWalletCount = await prisma.veve_wallets.count()
            let new_wallets = currentWalletCount - previousWalletCount
            if (currentWalletCount >= previousWalletCount) {
                const imxStats = await prisma.imx_stats.update({
                    where: {
                        project_id: VEVE
                    }, data: {
                        wallet_count: currentWalletCount
                    }
                })
                await pubsub.publish('IMX_VEVE_WALLET_STATS_UPDATED', {
                    imxVeveStatsUpdated: imxStats
                })
                console.log(`[INFO] ${new_wallets} new wallets`)
            }  

            const currentTokenCount = await prisma.veve_tokens.count()
            let new_tokens = currentTokenCount - previousTokenCount
            if (currentTokenCount >= previousTokenCount) {
                // const imxStats = await prisma.imx_stats.update({
                //     where: {
                //         project_id: VEVE
                //     }, data: {
                //         token_count: currentTokenCount
                //     }
                // })
                // await pubsub.publish('IMX_VEVE_TOKEN_STATS_UPDATED', {
                //     imxVeveStatsUpdated: imxStats
                // })
                console.log(`[INFO] ${new_tokens} new tokens`)
            }  

        } catch (e) {
            console.error('[ERROR] Prisma operation failed:', e);
        }
}



// Main function
export async function VEVE_IMX_TRANSACTIONS() {
    try {
        let nextToken = null;
        do {
            const timestampStart = new Date().toISOString(); 
            const imxTransactions = await fetchIMXTransactions(nextToken);
            nextToken = imxTransactions.nextToken;
            await processIMXTransactions(imxTransactions);
            const timestampEnd = new Date().toISOString(); 
            console.log(`[START] Loop iteration started at: ${timestampStart}`);
            console.log(`[END] Loop iteration finished at: ${timestampEnd}`);
        } while (nextToken);
    } catch (e) {
        console.log(`[ERROR] VEVE_IMX_TRANSACTIONS:`, e);
    }
}

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

//     } catch (e){
//         console.log('[ERROR] VEVE_IMX_TRANSACTIONS: ', e)
//     }

// }

VEVE_IMX_TRANSACTIONS();