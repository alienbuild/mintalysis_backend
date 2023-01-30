import fetch from 'node-fetch'
import {PrismaClient} from "@prisma/client"
import { setTimeout } from 'node:timers/promises'

const prisma = new PrismaClient();

const getMarketListings = (collectibleId) => {
    return `query MarketFromCollectibleTypeQuery {
  marketListingFromCollectibleType(
    first: 1000
    filterOptions: {collectibleTypeId: "${collectibleId}", listingType: FIXED}
    sortOptions: {sortBy: PRICE, sortDirection: ASCENDING}
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

    const imxLookup = async (user, index) => {
    await setTimeout(1000 * index)
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
        console.log(`Error token_id: collectible_id: ${user.collectibleId} - edition: ${user.issueNumber} : `, e )
    }

}

const GetWalletUsernamesFromVeve = async () => {

    const collectibles = await prisma.veve_collectibles.findMany({
        orderBy: [
            {
                collectible_id: 'desc'
            }
        ]
    })

    console.log('collectibles is: ', collectibles.length)

    await collectibles.map(async (collectible, index) => {
        await setTimeout(5000 * index)
        console.log(`[FETCHING] - ${collectible.name}`)
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
                query: getMarketListings(collectibleId),
            }),
        })
            .then(market_listings => market_listings.json())
            .then(async market_listings =>
            {
                console.log('[VEVE] RECEIVED DATA')

                const listings = market_listings.data.marketListingFromCollectibleType.edges
                const userLookup = []

                await listings.map(async (listing, index) => {
                    // if (index > 3) return
                    const {sellerId, sellerName, issueNumber} = listing.node
                    userLookup.push({sellerId, sellerName, issueNumber, collectibleId})
                })

                console.log('[VEVE] Found users to lookup: ', userLookup.length)

                userLookup.map(async (user, index) => {
                    await setTimeout(1000 * index)
                    const exisitingUser = await prisma.veve_wallets.findUnique({
                        where: {
                            veve_username: user.sellerName
                        }
                    })

                    if (!exisitingUser) {
                        await setTimeout(1000 * index)
                        const wallet_address = await imxLookup(user, index)
                        if (wallet_address && wallet_address.length > 1){
                            await setTimeout(1000 * index)
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

        console.log(`[FINISHED]: ${collectible.collectible_id} - ${collectible.name}`)
    })


}

GetWalletUsernamesFromVeve()