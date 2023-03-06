import {PrismaClient} from "@prisma/client"
import { customAlphabet } from 'nanoid'
import { uniqueNamesGenerator, colors, NumberDictionary } from 'unique-names-generator';
const nanoid = customAlphabet('1234567890abcdef', 5)
import slugify from 'slugify'
import fetch from "node-fetch";
import {cookieRotator} from "./alice/cookieRotator.js";
import {setTimeout} from "node:timers/promises";
import moment from "moment";

const prisma = new PrismaClient()


import {fishSpecies} from "./fish_dictionary.js";

const name_wallets = async () => {

    // const totalWalletCount = 2
    const totalWalletCount = await prisma.veve_wallets.count()
    console.log('totalWalletCount are: ', totalWalletCount)

    for (let i = 0; i < totalWalletCount; i++) {

        console.log('[PROCESSING] Batch: ', i + 1)

        const wallets = await prisma.veve_wallets.findMany({
            skip: i * 10000,
            take: 10000
        })

        await wallets.map(async wallet => {

            const numberDictionary = NumberDictionary.generate({ min: 10, max: 9999 });

            const walletName = uniqueNamesGenerator({
                dictionaries: [fishSpecies, numberDictionary],
                length: 2,
                separator: '',
                style: 'capital'
            });

            try {
                await prisma.veve_wallets.update({
                    where: { id: wallet.id },
                    data: {
                        tags: { create: { name: walletName } },
                    },
                })
            } catch (e) {
                console.log(`[FAILED]: Could not updated ${wallet.id}`, e)
            }

        })

        console.log(`[SUCCESS] Batch ${i + 1}`)

    }



}

name_wallets()