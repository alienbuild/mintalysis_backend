import fetch from 'node-fetch'
import { setTimeout } from 'node:timers/promises'

let tokenItems = []
let fullCapture = false
let i = 0
let pageSize = 200

const fetchInitialData = async (tokenCount, wallet_address) => {
    const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=eyJpZCI6IjB4YmFlNGNjNWM2ZDA4NDIxZGQ2OTdkZjQwYzQzYjQ1OTVmMTNkMTY2NjMzNjQzNWM5ZmJkODVjMmNkNjFiN2IxYyIsIm5hbWUiOiIjMDEgRWR1YXJkbyBSaXNzbyBCYXRtYW4iLCJ1cGRhdGVkX2F0IjoiMjAyMi0xMS0xMVQwOTowMDo1My4yNzE1OTdaIn0`)
    const walletItems = await getWalletItems.json()

    await walletItems.result.map(item => {
        i++
        tokenItems.push(Number(item.token_id))
    })

    if (!walletItems.cursor) fullCapture = true
    if (!fullCapture) {
        await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
    }
}

const keepFetchingData = async (cursor, tokenCount, wallet_address) => {
    try {
        await setTimeout(1500)
        // if (tokenCount <= 200) pageSize = tokenCount
        const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=${cursor}`)
        const walletItems = await getWalletItems.json()

        await walletItems.result.map(item => {
            tokenItems.push(Number(item.token_id))
        })

        if (!cursor) fullCapture = true
        if (!fullCapture) await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
    } catch (e) {
        console.log('[ERROR]: Something went wrong fetching more data.')
    }
}

export const veveVaultResolvers = {
    veveVaultImport: async (_, { payload }, { userInfo, prisma }) => {

        const { userId } = userInfo
        const user = await prisma.users.findUnique({
            where: {
                id: userInfo.userId
            },
            select: {
                role: true
            }
        })

        const { username, edition, collectible_id, project_id, kraken } = payload

        const token = await prisma.tokens.findFirst({
            where: {
                collectibleId: collectible_id,
                edition: edition
            },
            select: {
                token_id: true,
                mint_date: true,
                name: true,
            },
        })

        const { token_id } = token

        const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
        const imxOwner = await getImxOwner.json()
        const wallet_address = imxOwner.user

        // TODO: Check if the wallet address is already assigned to a user
        // If the wallet is already assigned throw new error
        // Prompt user to use extension to validate their ownership

        // Get token count
        const getTokenCount = await fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.IMX_API
            },
            body: JSON.stringify({query: `query getWalletCollections { getWalletCollections(address: "${wallet_address}") { items { token_count } } }`})
        })
        const tokenCount = await getTokenCount.json()

        await fetchInitialData(tokenCount, wallet_address, userId, username, prisma)

        console.log('All tokens gathered: ', tokenCount.length)

        const userAssets = await prisma.$transaction(tokenItems.map((token) =>
            prisma.tokens.upsert({
                    create: {
                        token_id: token,
                        toProcess: true
                    },
                    update: {
                        user_id: userId
                    },
                    where: {
                        token_id: token
                    },
                    select: {
                        collectibleId: true,
                        uniqueCoverId: true,
                        type: true
                    }
                })
        ))

        let collectibleIds = []
        let uniqueCoverIds = []
        await userAssets.map((asset) => {
            if (asset.type === 'collectible'){
                collectibleIds.push(asset.collectibleId)
            } else if (asset.type === 'comic'){
                uniqueCoverIds.push(asset.uniqueCoverId)
            }
        })
        console.log('all tokens have been updated.' , tokenItems.length)

        await prisma.users.update({
            data: {
                projects: {
                    connectOrCreate: {
                        where: { id: project_id },
                        create: { id: project_id }
                    }
                },
                veve_collectibles: {
                    connectOrCreate: collectibleIds.map((_collectibleId) => {
                        return {
                            where: { collectible_id: _collectibleId },
                            create: { collectible_id: _collectibleId }
                        }
                    })
                    // connectOrCreate: {
                    //     where: {
                    //         collectible_id: 'a31da526-c03e-49b0-8c10-c93a243a9fb5'
                    //     },
                    //     create: {
                    //         collectible_id: 'a31da526-c03e-49b0-8c10-c93a243a9fb5'
                    //     }
                    // },
                },
            },
            where: {
                id: userId
            },
        })

        console.log('updating profile.')
        await prisma.profile.update({
            data: {
                onboarded: true,
                veve_username: username,
                veve_wallet_imported: true,
                veve_wallet_address: wallet_address
            },
            where: {
                user_id: userId
            }
        })
        console.log('profile updated.')

        return {
            "wallet_address": wallet_address,
            "token_count": tokenCount.data.getWalletCollections.items[0].token_count
        }
    }
}