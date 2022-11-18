import fetch from 'node-fetch'

let tokenItems = []
let fullCapture = false
let i = 0
let pageSize = 200

const fetchInitialData = async (tokenCount, wallet_address, userId, username) => {
    const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=eyJpZCI6IjB4YmFlNGNjNWM2ZDA4NDIxZGQ2OTdkZjQwYzQzYjQ1OTVmMTNkMTY2NjMzNjQzNWM5ZmJkODVjMmNkNjFiN2IxYyIsIm5hbWUiOiIjMDEgRWR1YXJkbyBSaXNzbyBCYXRtYW4iLCJ1cGRhdGVkX2F0IjoiMjAyMi0xMS0xMVQwOTowMDo1My4yNzE1OTdaIn0`)
    const walletItems = await getWalletItems.json()

    walletItems.result.map(item => {
        i++
        tokenItems.push(Number(item.token_id))
    })

    if (!walletItems.cursor) fullCapture = true
    if (!fullCapture) {
        await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
    }
}

const keepFetchingData = async (cursor, tokenCount, wallet_address) => {
    console.log('Fetching more data.')
    if (tokenCount <= 200) pageSize = tokenCount
    const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=${cursor}`)
    const walletItems = await getWalletItems.json()

    walletItems.result.map(item => {
        tokenItems.push(Number(item.token_id))
    })

    if (!cursor) fullCapture = true
    if (!fullCapture) await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
}

export const veveVaultResolvers = {
    veveVaultImport: async (_, { payload }, { userInfo, prisma }) => {
        const { userId } = userInfo
        const { username, edition, collectible_id } = payload

        // Get token id
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

        // Get wallet address of owner
        const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
        const imxOwner = await getImxOwner.json()
        const wallet_address = imxOwner.user

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

        console.log(`[FINISHED] Found ${tokenItems.length} tokens in wallet ${wallet_address}`)

        await prisma.profile.update({
            data: {
                wallet_address: wallet_address,
                veve_username: username
            },
            where: {
                user_id: userId
            }
        })
        console.log('Updated the users wallet address in their profile.')

        await prisma.tokens.updateMany({
            data: {
                user_id: userId
            },
            where: {
                token_id: { in: tokenItems }
            }
        })

        console.log('Assigned tokens to user.')

        return {
            "wallet_address": wallet_address,
            "token_count": tokenCount.data.getWalletCollections.items[0].token_count
        }
    }
}