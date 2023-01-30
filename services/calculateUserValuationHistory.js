import {PrismaClient} from "@prisma/client"
import { setTimeout } from 'node:timers/promises'
import UserValuation from '../models/UserValuation.js'
import CollectiblePrice from "../models/CollectiblePrices.js"
import mongoose from "mongoose"

const prisma = new PrismaClient()

// MongoDB Database
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((e) => console.log('Error connecting to MongoDB', e))

const getCollectibleId = async (token_id) => {
    const collectible = await prisma.veve_tokens.findUnique({
        where: {
            token_id
        },
        select: {
            collectible_id: true
        }
    })

    return collectible.collectible_id
}

const getTransactions = async (wallet_address) => {

    const purchases = await prisma.veve_transfers.findMany({
        where: {
            to_wallet: wallet_address
        },
        select: {
            token_id: true,
            timestamp: true
        }
    })
    console.log('[SUCCESS] Retrieved purchases')

    const sales = await prisma.veve_transfers.findMany({
        where: {
            from_wallet: wallet_address
        },
        select: {
            token_id: true,
            timestamp: true
        }
    })
    console.log('[SUCCESS] Retrieved sales')

    let user_vault = []
    console.log('[CALCULATING] Token sale dates')
    await purchases.forEach((purchase) => {
        const match = sales.filter(obj => obj.token_id === purchase.token_id)
        if (match && match.length > 0){
            user_vault.push({ token_id: purchase.token_id, purchase_date: purchase.timestamp, sale_date: match[0].timestamp })
        } else {
            user_vault.push({ token_id: purchase.token_id, purchase_date: purchase.timestamp })
        }
    })

    user_vault.map(async (item, index) => {
        await setTimeout(200 * index)

        const collectibleId = await getCollectibleId(item.token_id)

        if (!item.sale_date) {

            const floorPrices = await CollectiblePrice.aggregate([
                {
                    "$match": {
                        collectibleId: collectibleId,
                        "date": {
                            $gte: new Date(item.purchase_date)
                        }
                    }
                },
                {
                    "$group": {
                        _id: {
                            symbol: "$collectibleId",
                            date: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "day",
                                    binSize: 1
                                },
                            },
                        },
                        value: { $avg: "$value" },
                    }
                },
                {
                    "$set": {
                        date: "$_id.date",
                    }
                },
                {
                    $sort : { "date": 1 }
                }
            ])

            floorPrices.map(async floor_price => {
                await setTimeout(200 * index)
                const currentValuation = await UserValuation.findOne({ 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date })

                if (currentValuation && currentValuation.user_id){

                    await UserValuation.findOneAndUpdate(
                        { 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date },
                        {
                            user_id: "18e126fe-1c77-4f70-b687-f029140303ea",
                            date: floor_price.date,
                            valuation: Number( currentValuation.valuation + floor_price.value),
                            valuation_collectibles: Number( currentValuation.valuation + floor_price.value),
                            valuation_comics: 0
                        },
                        { upsert: true }
                    )
                        .then(res => {
                            console.log('[SUCCESS] Saved new valuation')
                        })
                        .catch(err => console.log('[ERROR]: ', err))

                } else {
                    await UserValuation.findOneAndUpdate(
                        { 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date },
                        {
                            user_id: "18e126fe-1c77-4f70-b687-f029140303ea",
                            date: floor_price.date,
                            valuation: floor_price.value,
                            valuation_collectibles: floor_price.value,
                            valuation_comics: 0
                        },
                        { upsert: true }
                    )
                        .then(res => {
                            console.log('[SUCCESS] Saved new valuation')
                        })
                        .catch(err => console.log('[ERROR]: ', err))
                }

            })

        } else {

            const floorPrices = await CollectiblePrice.aggregate([
                {
                    "$match": {
                        collectibleId: collectibleId,
                        "date": {
                            $gte: new Date(item.purchase_date),
                            $lte: new Date(item.sale_date)
                        }
                    }
                },
                {
                    "$group": {
                        _id: {
                            symbol: "$collectibleId",
                            date: {
                                $dateTrunc: {
                                    date: "$date",
                                    unit: "day",
                                    binSize: 1
                                },
                            },
                        },
                        value: { $avg: "$value" },
                    }
                },
                {
                    "$set": {
                        date: "$_id.date",
                    }
                },
                {
                    $sort : { "date": 1 }
                }
            ])

            floorPrices.map(async floor_price => {
                await setTimeout(200 * index)
                const currentValuation = await UserValuation.findOne({ 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date })

                if (currentValuation && currentValuation.user_id){

                    await UserValuation.findOneAndUpdate(
                        { 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date },
                        {
                            user_id: "18e126fe-1c77-4f70-b687-f029140303ea",
                            date: floor_price.date,
                            valuation: Number( currentValuation.valuation + floor_price.value),
                            valuation_collectibles: Number( currentValuation.valuation + floor_price.value),
                            valuation_comics: 0
                        },
                        { upsert: true }
                    )
                        .then(res => {
                            console.log('[SUCCESS] Saved new valuation')
                        })
                        .catch(err => console.log('[ERROR]: ', err))

                } else {
                    await UserValuation.findOneAndUpdate(
                        { 'user_id': "18e126fe-1c77-4f70-b687-f029140303ea", date: floor_price.date },
                        {
                            user_id: "18e126fe-1c77-4f70-b687-f029140303ea",
                            date: floor_price.date,
                            valuation: floor_price.value,
                            valuation_collectibles: floor_price.value,
                            valuation_comics: 0
                        },
                        { upsert: true }
                    )
                        .then(res => {
                            console.log('[SUCCESS] Saved new valuation')
                        })
                        .catch(err => console.log('[ERROR]: ', err))
                }

            })

        }
    })

}

const calculateUserValuationHistory = async () => {

    await getTransactions('0xad36f165e95d50793b4f1b7fc2c2ddf996b60b9d')

}

calculateUserValuationHistory()