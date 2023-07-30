import axios from 'axios'
import {PrismaClient} from "@prisma/client";
import {setTimeout} from "node:timers/promises";

import { ChatGPTAPI } from 'chatgpt'


const chatGptKey = "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"

const prisma = new PrismaClient()

const dfnVeveEditionType = (edition) => {
    switch (edition){
        case 'FA':
            return 'First apperance'
        case 'FE':
            return 'First edition'
        case 'CE':
            return 'Con exclusive'
        default:
            return
    }
}

const translateCollectibles = async () => {

    const chatgpt = new ChatGPTAPI({
        apiKey: chatGptKey
    })

    const translateTo = "Chinese"
    const languageKey = "CN"

    const collectibles = await prisma.veve_collectibles.findMany()

    console.log('COLLECTIBLES RECEIVED..TRANSLATING...')

    collectibles.map(async (collectible, index) => {
        // if (index > 0) return

        try {

            let translatedRarity
            let translatedEditionType

            await setTimeout(80000 * index)
            console.log('[WAITING 80 SECONDS]')

            const name = `Translate the below text into ${translateTo}\n ${collectible.name}`
            console.log(`[TRANSLATING TITLE TO ${translateTo}...]`, collectible.name)
            const translatedName = await chatgpt.sendMessage(name)

            await setTimeout(5000 * index)

            const description = `Translate the below description into ${translateTo}\n ${collectible.description}`
            console.log(`[TRANSLATING DESCRIPTION TO ${translateTo}...]`, collectible.name)
            const translatedDescription = await chatgpt.sendMessage(description)

            if (collectible && collectible.rarity){
                const rarity = `Translate the below text into ${translateTo}\n ${collectible.rarity.replace(`_`, ` `)}`
                console.log(`[TRANSLATING RARITY TO ${translateTo}...]`, collectible.rarity.replace(`_`, ` `))
                await setTimeout(5000 * index)
                translatedRarity = await chatgpt.sendMessage(rarity)
            }

            if (collectible && collectible.edition_type){
                const edition = `Translate the below text into ${translateTo}\n ${dfnVeveEditionType(collectible.edition_type)}`
                console.log(`[TRANSLATING EDITION TYPE TO ${translateTo}...]`, dfnVeveEditionType(collectible.edition_type))
                await setTimeout(5000 * index)
                translatedEditionType = await chatgpt.sendMessage(edition)
            }

            const save = await prisma.veve_collectibles.update({
                where: {
                    collectible_id: collectible.collectible_id
                },
                data: {
                    translations: {
                        create: {
                            name: translatedName.text,
                            description: translatedDescription.text,
                            rarity: translatedRarity.text,
                            edition_type: translatedEditionType.text,
                            language: languageKey
                        }
                    }
                },
                select: {
                    translations: true
                }
            })

            console.log('save is: ', save)

        } catch (e) {
            console.log('[FAILED TRANSLATING] ', e)
        }
    })

}

translateCollectibles()

