import fetch from 'node-fetch'

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
        // const wallet_address = imxOwner.user
        const wallet_address = "0x7be178ba43a9828c22997a3ec3640497d88d2fd3"

        // Get token count
        const getTokenCount = await fetch(`https://3vkyshzozjep5ciwsh2fvgdxwy.appsync-api.us-west-2.amazonaws.com/graphql`, {
            method: 'POST',
            headers: {
                'x-api-key': 'da2-exzypwa6hng45btg7cwf323cdm'
            },
            body: JSON.stringify({query: `query getWalletCollections { getWalletCollections(address: "0x7be178ba43a9828c22997a3ec3640497d88d2fd3") { items { token_count } } }`})
        })
        const tokenCount = await getTokenCount.json()
        console.log('token count is: ', tokenCount.data.getWalletCollections.items[0].token_count)

        // Get tokens from the wallet address
        let pageSize = 200
        if (tokenCount <= 200) pageSize = tokenCount
        const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=eyJpZCI6IjB4YmFlNGNjNWM2ZDA4NDIxZGQ2OTdkZjQwYzQzYjQ1OTVmMTNkMTY2NjMzNjQzNWM5ZmJkODVjMmNkNjFiN2IxYyIsIm5hbWUiOiIjMDEgRWR1YXJkbyBSaXNzbyBCYXRtYW4iLCJ1cGRhdGVkX2F0IjoiMjAyMi0xMS0xMVQwOTowMDo1My4yNzE1OTdaIn0`)
        const walletItems = await getWalletItems.json()

        console.log('wallet items is: ', walletItems.result.length)
        const cursor = walletItems.cursor
        console.log('cursor is: ', cursor)


        return {
            "wallet_address": wallet_address,
            "token_count": tokenCount.data.getWalletCollections.items[0].token_count
        }
    }
}