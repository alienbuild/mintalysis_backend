import {PrismaClient} from "@prisma/client"
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdef', 5)
import slugify from 'slugify'
import fetch from "node-fetch";
import {cookieRotator} from "./alice/cookieRotator.js";
import {setTimeout} from "node:timers/promises";
import moment from "moment";

const prisma = new PrismaClient()

const playing = async () => {
    console.log('[PLAYING] LOL]')

    const blockchainId = 8706473

    const wallet_add = await prisma.veve_transfers.findFirst({
        where: {
            token_id: blockchainId
        },
        orderBy: {
            timestamp: 'desc',
        },
        select: {
            to_wallet: true
        }
    })

    console.log('wallet_add is: ', wallet_add)



}

playing()