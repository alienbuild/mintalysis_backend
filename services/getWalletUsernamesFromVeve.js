import fetch from 'node-fetch'
import {PrismaClient} from "@prisma/client"
import { setTimeout } from 'node:timers/promises'
import Comic from '../models/_LgeacyComic.js'
import mongoose from "mongoose";

const prisma = new PrismaClient();

// MongoDB Database
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((e) => console.log('Error connecting to MongoDB', e))

const getCollectibleMarketListings = (collectibleId) => {
    return `query MarketFromCollectibleTypeQuery {
  marketListingFromCollectibleType(
    first: 1000
    filterOptions: {collectibleTypeId: "${collectibleId}", listingType: FIXED}
    sortOptions: {sortBy: PRICE, sortDirection: DESCENDING}
  ) {
    edges {
      node {
        id
        sellerId
        sellerName
        issueNumber
      }
    }
  }
} `
}

const imxCollectibleLookup = async (user, index) => {
    await setTimeout(Math.floor(Math.random() * 2500) + 14000)
    try {
        const token = await prisma.veve_tokens.findFirst({
            where: {
                collectible_id: user.collectibleId,
                edition: user.issueNumber
            },
            select: {
                token_id: true,
            },
        })

        const { token_id } = token
        const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
        const imxOwner = await getImxOwner.json()
        return imxOwner.user

    } catch (e) {
        // console.log(`Error token_id: collectible_id: ${user.collectibleId} - edition: ${user.issueNumber} : `, e )
    }

}

export const GetWalletUsernamesFromVeveCollectibles = async () => {
    console.log(`[FETCHING USERNAMES FROM VEVE COLLECTIBLES MARKETPLACE]`)

    const collectibles = await prisma.veve_collectibles.findMany({
        orderBy: [
            {
                collectible_id: 'desc'
            }
        ]
    })

    // console.log('collectibles is: ', collectibles.length)

    await collectibles.map(async (collectible, index) => {
        await setTimeout(Math.floor(Math.random() * 2500) + 14000)
        // console.log(`[FETCHING] - ${collectible.name}`)
        // if (index > 0) return
        const collectibleId = collectible.collectible_id

        await fetch(`https://web.api.prod.veve.me/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'client-name': 'alice-backend',
                'client-version': '...',
                'user-agent': 'alice-requests',
                'cookie': "veve=s%3ABBzqVcXCx-u7b2OnNrI2hQEwq14FXASo.C%2F5sObS5AunP8qIBZeqDEC3WnCnVsEdY9qMNQ%2FPGQK4"
            },
            body: JSON.stringify({
                query: getCollectibleMarketListings(collectibleId),
            }),
        })
            .then(market_listings => market_listings.json())
            .then(async market_listings =>
            {
                // console.log('[VEVE] RECEIVED DATA')

                const listings = market_listings.data.marketListingFromCollectibleType.edges
                const userLookup = []

                await listings.map(async (listing, index) => {
                    // if (index > 3) return
                    const {sellerId, sellerName, issueNumber} = listing.node
                    userLookup.push({sellerId, sellerName, issueNumber, collectibleId})
                })

                // console.log('[VEVE] Found users to lookup: ', userLookup.length)

                userLookup.map(async (user, index) => {
                    await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                    const exisitingUser = await prisma.veve_wallets.findUnique({
                        where: {
                            veve_username: user.sellerName
                        }
                    })

                    if (!exisitingUser) {
                        await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                        const wallet_address = await imxCollectibleLookup(user, index)
                        if (wallet_address && wallet_address.length > 1){
                            await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                            console.log(`[NEW USER] - ${wallet_address}`)
                            try {
                                await prisma.veve_wallets.upsert({
                                    where: {
                                        id: wallet_address
                                    },
                                    update: {
                                        veve_username: user.sellerName,
                                        veve_id: user.sellerId
                                    },
                                    create: {
                                        id: wallet_address,
                                        veve_username: user.sellerName,
                                        veve_id: user.sellerId
                                    }
                                })
                                console.log(`[SUCCESS] USER ${user.sellerName}`)
                            } catch (e) {
                                // console.log('[ERROR] Updating user', e)
                            }
                        }
                    }

                })

            })
            .catch(e => console.log('[ERROR] getting veve usernames. ', e))

        // console.log(`[FINISHED]: ${collectible.collectible_id} - ${collectible.name}`)
    })


}

const getComicMarketListings = (coverId) => {
    return `query MarketFromComicCoverQuery{
  marketListingFromComicCover(
    first: 1000
    filterOptions: { comicCoverId: "${coverId}", listingType: FIXED }
    sortOptions: { sortBy: PRICE, sortDirection: ASCENDING }
  ) {
    edges {
      node {
        id
        sellerId
        sellerName
        issueNumber
        image {
            id
        }
      }
    }
  }
}`
}

const imxComicLookup = async (user, index) => {
    await setTimeout(Math.floor(Math.random() * 2500) + 14000)

    try {

        const token = await prisma.veve_tokens.findFirst({
            where: {
                unique_cover_id: user.unique_cover_id,
                edition: user.issueNumber
            },
            select: {
                token_id: true,
            },
        })

        const { token_id } = token
        const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
        const imxOwner = await getImxOwner.json()
        return imxOwner.user

    } catch (e) {

    }

}

const veveComicLookupQuery = () => {
    return `query MarketByComicTypeQuery {
  marketListingByComicTypeV2(
    first: 3000
    sortOptions: { sortBy: CREATED_AT, sortDirection: DESCENDING }
    filterOptions: {}
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        ...MarketComicType
      }
    }
  }
}

fragment MarketComicType on MarketListingByComicTypeObject {
  id
  name
  totalMarketListings
  startYear
  comicNumber
  cover {
    id
    rarity
    image {
      id
      url
      direction
    }
  }
  covers {
    id
    rarity
    totalMarketListings
  }
}
`
}

const fetchComics = async () => {
    await fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'client-name': 'alice-backend',
            'client-version': '...',
            'user-agent': 'alice-requests',
            'cookie': "veve=s%3ABBzqVcXCx-u7b2OnNrI2hQEwq14FXASo.C%2F5sObS5AunP8qIBZeqDEC3WnCnVsEdY9qMNQ%2FPGQK4"
        },
        body: JSON.stringify({
            query: veveComicLookupQuery(),
        }),
    })
        .then(comics => comics.json())
        .then(async comics => {
            return comics
        })
        .catch(e => console.log('error: ', e))
}

export const GetWalletUsernamesFromVeveComics = async () => {
    console.log(`[FETCHING USERNAMES FROM VEVE COMICS MARKETPLACE]`)

    try {

        await fetch(`https://web.api.prod.veve.me/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'client-name': 'alice-backend',
                'client-version': '...',
                'user-agent': 'alice-requests',
                'cookie': "veve=s%3ABBzqVcXCx-u7b2OnNrI2hQEwq14FXASo.C%2F5sObS5AunP8qIBZeqDEC3WnCnVsEdY9qMNQ%2FPGQK4"
            },
            body: JSON.stringify({
                query: veveComicLookupQuery(),
            }),
        })
            .then(comics => comics.json())
            .then(async comics => {
                const comicsItems = comics.data.marketListingByComicTypeV2.edges

                await comicsItems.map(async (comic, index) => {
                        // if (index > 0) return
                    await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                    await comic.node.covers.map(async (cover, index) => {
                            if (cover.rarity === "COMMON") return

                            await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                            // console.log(`[FETCHING]: ${comic.node.name} #${comic.node.comicNumber}`)

                            const coverId = cover.id

                            await fetch(`https://web.api.prod.veve.me/graphql`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'client-name': 'alice-backend',
                                    'client-version': '...',
                                    'user-agent': 'alice-requests',
                                    'cookie': "veve=s%3ABBzqVcXCx-u7b2OnNrI2hQEwq14FXASo.C%2F5sObS5AunP8qIBZeqDEC3WnCnVsEdY9qMNQ%2FPGQK4"
                                },
                                body: JSON.stringify({
                                    query: getComicMarketListings(coverId),
                                }),
                            })
                                .then(market_listings => market_listings.json())
                                .then(async market_listings => {
                                    // console.log('[VEVE] RECEIVED DATA')

                                    const listings = market_listings.data.marketListingFromComicCover.edges
                                    const userLookup = []

                                    await listings.map(async (listing, index) => {
                                        // if (index > 2) return
                                        const {sellerId, sellerName, issueNumber} = listing.node
                                        userLookup.push({
                                            sellerId,
                                            sellerName,
                                            issueNumber,
                                            unique_cover_id: listing.node.image.id
                                        })
                                    })

                                    // console.log('[VEVE] Found users to lookup: ', userLookup.length)

                                    userLookup.map(async (user, index) => {
                                        await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                                        const exisitingUser = await prisma.veve_wallets.findUnique({
                                            where: {
                                                veve_username: user.sellerName
                                            }
                                        })

                                        if (!exisitingUser) {
                                            await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                                            const wallet_address = await imxComicLookup(user, index)

                                            if (wallet_address && wallet_address.length > 1) {
                                                await setTimeout(Math.floor(Math.random() * 2500) + 14000)
                                                // console.log(`[NEW USER] - ${wallet_address}`)
                                                try {
                                                    await prisma.veve_wallets.upsert({
                                                        where: {
                                                            id: wallet_address
                                                        },
                                                        update: {
                                                            veve_username: user.sellerName,
                                                            veve_id: user.sellerId
                                                        },
                                                        create: {
                                                            id: wallet_address,
                                                            veve_username: user.sellerName,
                                                            veve_id: user.sellerId
                                                        }
                                                    })
                                                    console.log(`[SUCCESS] USER ${user.sellerName}`)
                                                } catch (e) {

                                                }

                                            }

                                        }

                                    })


                                })
                                .catch(e => console.log('[ERROR] ', e))

                        })

                    })


            })
            .catch(e => console.log('error: ', e))

        // const comics = await Comic.find({}).select('cover.id cover.rarity comicSeries.name comicNumber')


    } catch (e) {
        console.log('lol no. ', e)
    }

}

// GetWalletUsernamesFromVeveCollectibles()
// GetWalletUsernamesFromVeveComics()