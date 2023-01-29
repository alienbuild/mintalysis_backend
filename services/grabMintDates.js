import fetch from "node-fetch"
import {setTimeout} from "node:timers/promises"
import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient();

let fullCapture = false

let updateCount = 11135400
const initCursor = "eyJpZCI6IjB4YzFmMjFjOGRlZTA2NTdhZTljZTQzYjc0MjZlODVhZjYxN2NmNjAyOWM2NGMyNWZjOTNhZTE4ZTQyMTBlYzE4ZiIsIm5hbWUiOiJXaGF0IElmPyIsInVwZGF0ZWRfYXQiOiIyMDIyLTExLTA5VDEzOjM3OjM5LjY4NzI1NVoifQ"
let endCursor
let remaining

const fetchInitialData = async () => {

    try {

        const data = await fetch(`https://api.x.immutable.com/v1/assets?page_size=5&collection=0xa7aefead2f25972d80516628417ac46b3f2604af&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=${initCursor}`)
        const tokens = await data.json()
        endCursor = tokens.cursor
        remaining = tokens.remaining

        console.log(`[SAVING] ${tokens.result.length} tokens...`)

        try {

            await tokens.result.map(async (token, index) => {

                await prisma.veve_tokens.upsert({
                    where: {
                        token_id: Number(token.token_id)
                    },
                    update: {
                        mint_date: new Date(token.metadata.mintDate)
                    },
                    create: {
                        token_id: Number(token.token_id),
                        mint_date: new Date(token.metadata.mintDate)
                    },
                })

                updateCount += 200
                console.log(`[SUCCESS][SAVED] ${tokens.result.length} tokens. [TOTAL] ${updateCount}`)
                //  await prisma.veve_tokens.update({
                //     where: {
                //         token_id: Number(token.token_id)
                //     },
                //     data: {
                //         mint_date: new Date(token.metadata.mintDate)
                //     }
                // })
            })

        } catch (e) {
            console.log('Did not save: ', e)
        }

        if (remaining > 0) fullCapture = false
        if (!fullCapture) {
            await keepFetchingData(endCursor)
        }

    } catch (e) {
        console.log('CATCH ERROR: ', e)
    }

}

const keepFetchingData = async (endCursor) => {
    console.log('***[FETCHING]***')
    try {

        await setTimeout(1500)

        const data = await fetch(`https://api.x.immutable.com/v1/assets?page_size=200&collection=0xa7aefead2f25972d80516628417ac46b3f2604af&sell_orders=true&order_by=name&direction=asc&status=imx&cursor=${endCursor}`)
        const tokens = await data.json()
        endCursor = tokens.cursor

        console.log(`[SAVING] ${tokens.result.length} tokens...`)

        try {
            await tokens.result.map(async (token, index) => {

                await prisma.veve_tokens.upsert({
                    where: {
                        token_id: Number(token.token_id)
                    },
                    update: {
                        mint_date: new Date(token.metadata.mintDate)
                    },
                    create: {
                        token_id: Number(token.token_id),
                        mint_date: new Date(token.metadata.mintDate)
                    },
                })

                // await prisma.veve_tokens.update({
                //     where: {
                //         token_id: Number(token.token_id)
                //     },
                //     data: {
                //         mint_date: new Date(token.metadata.mintDate)
                //     }
                // })
            })

            updateCount += 200
            console.log(`[SUCCESS][SAVED] ${tokens.result.length} tokens. [TOTAL] ${updateCount}`)
        } catch (e) {
            console.log('Nah did not save: ', e)
        }

        if (remaining > 0) fullCapture = false
        if (!fullCapture) {
            console.log('Fetching more...', endCursor)
            await keepFetchingData(endCursor)
        }

    } catch(e) {
        console.log('Error getting tokens: ', e)
    }

}

export const grabMintDates = async () => {

    await fetchInitialData()

}


grabMintDates()