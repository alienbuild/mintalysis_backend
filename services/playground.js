import {PrismaClient} from "@prisma/client"
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdef', 5)
import slugify from 'slugify'
import fetch from "node-fetch";
import {cookieRotator} from "./alice/cookieRotator.js";
import {setTimeout} from "node:timers/promises";
import moment from "moment";

const prisma = new PrismaClient()

const generateCollectibleSlugs = async () => {

    const collectibles = await prisma.veve_collectibles.findMany({
        select: {
            collectible_id: true,
            name: true,
            rarity: true,
            edition_type: true
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    collectibles.map(async(collectible, index) => {

        const slug = slugify(`${collectible.name} ${collectible.rarity} ${collectible.edition_type} ${nanoid()}`,{ lower: true, strict: true })

        await prisma.veve_collectibles.update({
            where: {
                collectible_id: collectible.collectible_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${collectible.collectible_id} slug to ${slug}`)

    })

}

const generateComicSlugs = async () => {

    const comics = await prisma.veve_comics.findMany({
        select: {
            unique_cover_id: true,
            name: true,
            rarity: true,
            comic_number: true,
            start_year: true
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    comics.map(async(comic, index) => {
        const slug = slugify(`${comic.name} ${comic.comic_number} ${comic.rarity} ${comic.start_year} ${nanoid()}`,{ lower: true, strict: true })
        await prisma.veve_comics.update({
            where: {
                unique_cover_id: comic.unique_cover_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${comic.unique_cover_id} slug to ${slug}`)

    })

}

const generateBrandSlugs = async () => {

    const brands = await prisma.veve_brands.findMany({
        select: {
            brand_id: true,
            name: true,
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    brands.map(async(brand, index) => {
        // if (index > 0) return
        const slug = slugify(`${brand.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_brands.update({
            where: {
                brand_id: brand.brand_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${brand.brand_id} slug to ${slug}`)

    })

}

const generateSeriesSlugs = async () => {

    const seriesGroup = await prisma.veve_series.findMany({
        select: {
            series_id: true,
            name: true,
            season: true
        }
    })

    seriesGroup.map(async(series, index) => {
        // if (index > 0) return
        const slug = slugify(`${series.name} season-${series.season}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_series.update({
            where: {
                series_id: series.series_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${series.series_id} slug to ${slug}`)

    })

}

const generateLicensorsSlugs = async () => {

    const licensors = await prisma.veve_licensors.findMany({
        select: {
            licensor_id: true,
            name: true,
        }
    })

    licensors.map(async(licensor, index) => {
        // if (index > 0) return
        const slug = slugify(`${licensor.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_licensors.update({
            where: {
                licensor_id: licensor.licensor_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${licensor.licensor_id} slug to ${slug}`)

    })

}

const generateArtistSlugs = async () => {

    const artists = await prisma.artists.findMany({
        select: {
            artist_id: true,
            name: true,
        }
    })

    artists.map(async(artist, index) => {
        // if (index > 0) return
        const slug = slugify(`${artist.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.artists.update({
            where: {
                artist_id: artist.artist_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${artist.artist_id} slug to ${slug}`)

    })

}

const generateCharacterSlugs = async () => {

    const characters = await prisma.characters.findMany({
        select: {
            character_id: true,
            name: true,
        }
    })

    characters.map(async(character, index) => {
        // if (index > 0) return
        const slug = slugify(`${character.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.characters.update({
            where: {
                character_id: character.character_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${character.character_id} slug to ${slug}`)

    })

}

const generateWriterSlugs = async () => {

    const writers = await prisma.writers.findMany({
        select: {
            author_id: true,
            name: true,
        }
    })

    writers.map(async(writer, index) => {
        // if (index > 0) return
        const slug = slugify(`${writer.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.writers.update({
            where: {
                author_id: writer.author_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${writer.author_id} slug to ${slug}`)

    })

}

// Scrape username/wallets from veve
const getVeveSuggestedUsers = (fragment) => {
    return `query  {
    suggestUsers(fragment: "${fragment}", limit: 20, showHiddenOrDisabledAccounts: false){
        id
        username
        profileCollectibles(first: 1){
            edges{
                node{
                    issueNumber
                    blockchainId
                    collectibleType {
                        id
                    }
                }
            }
        }
    }
}`
}

const lookupUserWallet = async (token_id) => {
    const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
    const imxOwner = await getImxOwner.json()
    return imxOwner.user
}

export const scrapeVeveSuggestedUsers = async () => {
    console.log('[STARTING] Getting suggested users from VEVE')

    const cookieToUse = cookieRotator()

    const fragment = "garyv"

    await fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'cookie': cookieToUse,
            'client-name': 'veve-web-app',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'client-operation': 'AuthUserDetails',
        },
        body: JSON.stringify({
            query: getVeveSuggestedUsers(fragment)
        }),
    })
        .then(suggested_users => suggested_users.json())
        .then(suggested_users => {
            const suggestedUsers = suggested_users?.data?.suggestUsers

            suggestedUsers.map(async (user, index) => {
                if (user?.profileCollectibles?.edges.length > 0) {
                    const wallet_address = await lookupUserWallet(user.profileCollectibles.edges[0].node.blockchainId)
                    try {

                        const exisitingUser = await prisma.veve_wallets.findUnique({
                            where: {
                                veve_username: user.username
                            }
                        })

                        if (!exisitingUser){
                            const saved_wallets = await prisma.veve_wallets.upsert({
                                where: {
                                    id: wallet_address
                                },
                                update: {
                                    veve_username: user.username,
                                    veve_id: user.id
                                },
                                create: {
                                    id: wallet_address,
                                    veve_username: user.username,
                                    veve_id: user.id
                                },
                                select: {
                                    veve_username: true
                                }
                            })
                            console.log('saved wallets is: ', saved_wallets)
                        } else {
                            console.log('No new wallets/users to save :(')
                        }


                    } catch (e) {
                        console.log('[ERROR]: Unable to save username and wallet.')
                    }

                }
            })

        })
        .catch(e => console.log('[ERROR] Unable to get suggested users. ', e))


}

// Aggregate usernames from veve feed... oy gonna take a while...
const getVeveFeedUsernames = (startTime) => {
    console.log('querying using the start time of: ', new Date(startTime).toISOString())
    return `query {
        feedPostList(filterOptions: { startTimeLessThan : "${new Date(startTime).toISOString()}" }){
             pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
            }
            edges{
                node {
                    startTime
                    user{
                        id  
                        username
                        profileCollectibles(first: 1){
                            edges{
                                node{
                                    issueNumber
                                    blockchainId
                                    collectibleType {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            }
            totalCount
        }
    }`
}

const keepFetchingFeedPosts = async (cursor) => {
    const cookieToUse = cookieRotator()
    console.log('[FETCHING DATA] Using cursor: ', cursor)
    try {
        await setTimeout(1500)

        await fetch(`https://web.api.prod.veve.me/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'cookie': cookieToUse,
                'client-name': 'veve-web-app',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'client-operation': 'AuthUserDetails',
            },
            body: JSON.stringify({
                query: getVeveFeedUsernames(cursor)
            }),
        }).then(veve_feed_usernames => veve_feed_usernames.json())
            .then(async veve_feed_usernames => {
                const pageInfo = veve_feed_usernames.data.feedPostList.pageInfo
                const feedPosts = veve_feed_usernames.data.feedPostList.edges

                const lastStartTime = feedPosts[feedPosts.length - 1].node.startTime
                console.log('lastStartTime is: ', lastStartTime)

                await feedPosts.map(async post => {
                    if (post.node?.user?.profileCollectibles?.edges.length > 0) {
                        const username = post.node.user.username
                        const id = post.node.user.id
                        try {

                            const wallet_address = await lookupUserWallet(post.node.user.profileCollectibles.edges[0].node.blockchainId)

                            const exisitingUser = await prisma.veve_wallets.findUnique({
                                where: {
                                    veve_username: username
                                }
                            })
                            if (!exisitingUser) {
                                const saved_wallets = await prisma.veve_wallets.upsert({
                                    where: {
                                        id: wallet_address
                                    },
                                    update: {
                                        veve_username: username,
                                        veve_id: id
                                    },
                                    create: {
                                        id: wallet_address,
                                        veve_username: username,
                                        veve_id: id
                                    },
                                    select: {
                                        veve_username: true
                                    }
                                })
                                console.log('saved wallets is: ', saved_wallets)
                            }


                        } catch (e) {
                            console.log('No new wallets/users to save :(')
                        }

                    }
                })

                if (pageInfo.endCursor) {
                    console.log('[AWAITING] Found more feed posts to grab.')
                    await setTimeout(2500)
                    await keepFetchingFeedPosts(lastStartTime)
                }

            })
            .catch(e => console.log('[ERROR] Unable to get usernames from the veve feed.', e))

    } catch (e) {
        console.log('[ERROR]: Something went wrong fetching more feed data.', e)
    }
}

const getVeveUsernamesFromFeed = async () => {
    const cookieToUse = cookieRotator()

    await fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'cookie': cookieToUse,
            'client-name': 'veve-web-app',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'client-operation': 'AuthUserDetails',
        },
        body: JSON.stringify({
            query: getVeveFeedUsernames("2021-11-04T19:30:17.213Z")
        }),
    })
        .then(veve_feed_usernames => veve_feed_usernames.json())
        .then(async veve_feed_usernames => {
            const pageInfo = veve_feed_usernames.data.feedPostList.pageInfo
            const feedPosts = veve_feed_usernames.data.feedPostList.edges
            console.log('page info is: ', pageInfo)
            console.log('[RETRIEVED] posts: ', veve_feed_usernames.data.feedPostList.totalCount)

            const lastStartTime = feedPosts[feedPosts.length - 1].node.startTime
            console.log('lastStartTime is: ', lastStartTime)

            await feedPosts.map(async post => {
                if (post.node?.user?.profileCollectibles?.edges.length > 0) {
                    const username = post.node.user.username
                    const id = post.node.user.id
                    try {
                        console.log(`User posted is: ${username}`)

                        const wallet_address = await lookupUserWallet(post.node.user.profileCollectibles.edges[0].node.blockchainId)

                        const exisitingUser = await prisma.veve_wallets.findUnique({
                            where: {
                                veve_username: username
                            }
                        })
                        if (!exisitingUser) {
                            const saved_wallets = await prisma.veve_wallets.upsert({
                                where: {
                                    id: wallet_address
                                },
                                update: {
                                    veve_username: username,
                                    veve_id: id
                                },
                                create: {
                                    id: wallet_address,
                                    veve_username: username,
                                    veve_id: id
                                },
                                select: {
                                    veve_username: true
                                }
                            })
                            console.log('saved wallets is: ', saved_wallets)
                        }


                    } catch (e) {
                        console.log('No new wallets/users to save :(', e)
                    }

                }
            })

            if (pageInfo.endCursor) {
                console.log('[AWAITING] Found more feed posts to grab.')
                await setTimeout(2000)
                await keepFetchingFeedPosts(lastStartTime)
            }

        })
        .catch(e => console.log('[ERROR] Unable to get usernames from the veve feed.', e))
}

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

let pageSize = 200
let i = 0
let tokenItems = []

const fetchInitialData = async (wallet_address, fullCapture = false, endCursor) => {
    let url = `https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}`
    if (endCursor && endCursor.length > 1) url = `https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&cursor=${endCursor}`

    const getWalletItems = await fetch(url)
    const walletItems = await getWalletItems.json()

    await walletItems.result.map(async item => {
        await setTimeout(150)
        i++
        await tokenItems.push(Number(item.token_id))
    })

    if (!walletItems.cursor) fullCapture = true
    if (!fullCapture) {
        await setTimeout(1100)
        await fetchInitialData(wallet_address, fullCapture, walletItems.cursor)
    }
}

const getTokenWalletAddressOwners = async (skip = 130000, take = 10000) => {
    console.log(`*****[FETCHING DATA FOR WALLETS]***** [SKIP]: ${skip}`)

    let count = 0
    try {

        const wallets = await prisma.veve_wallets.findMany({
            take: take,
            skip: skip,
            select:{
                id: true
            }
        })

        await wallets.map(async (wallet, index) => {
            try {
                await setTimeout(Math.floor(Math.random() * 10000) + 1000)

                await fetchInitialData(wallet.id)
                if (!tokenItems) {
                    try {
                        await prisma.veve_wallets.update({
                            where: {
                                id: wallet.id,
                            },
                            data: {
                                active: false
                            }
                        })
                        console.log(`[DEAD WALLET] https://immutascan.io/address/${wallet.id}. skip is ${skip}. count is ${count}`)
                    } catch (e) {
                        console.log('[PRISMA FAILED]')
                    }
                    tokenItems = []
                } else if (tokenItems && tokenItems.length >= 0) {
                    tokenItems.map(async (token, index) => {
                        await setTimeout(300 + index)
                        try {
                            await prisma.veve_tokens.upsert({
                                where: {
                                    token_id: Number(token)
                                },
                                update: {
                                    wallet_id: wallet.id
                                },
                                create: {
                                    token_id: Number(token)
                                }
                            })
                            console.log(`[SUCCESS] updated https://immutascan.io/address/${wallet.id} tokens. skip is ${skip}. count is ${count}`)

                        } catch (e) {
                            console.log('[PRISMA FAILED]')
                        }
                    })
                    count++
                    tokenItems = []
                }
            } catch (e) {
                count++
                console.log('ERROR GETTING FETCH INITIAL DATA', e)
                console.log(`[COUNT] ${count}`)
            }

        })

        // await getTokenWalletAddressOwners(take * 2, take)

    } catch (e) {
        console.log('[ERROR] Unable to get imx transactions to resolve the token holders.')
    }
}

// getTokenWalletAddressOwners()
getVeveUsernamesFromFeed() //
// generateWriterSlugs()
// scrapeVeveSuggestedUsers()