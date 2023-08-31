import fetch from 'node-fetch'
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Setup proxy
const proxy_string = process.env.PROXY
const proxy_parts = proxy_string.split(':')
const ip_address = proxy_parts[0]
const port = proxy_parts[1]
const username = proxy_parts[2]
const password = proxy_parts[3]

const getVevelatestCollectiblesQuery = () => {
    return `query collectibleTypeList {
        collectibleTypeList(first: 150, after:"YXJyYXljb25uZWN0aW9uOjg5OQ==", sortOptions: {sortBy: DROP_DATE, sortDirection: DESCENDING} ){
            pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
            }
            edges {
                node{
                    id
                    name
                    totalLikes
                    isFree
                    storePrice
                    isUnlimited
                    totalIssued
                    totalAvailable
                    description
                    rarity
                    variety
                    editionType
                    dropMethod
                    dropDate
                    marketFee
                    backgroundImage {
                        url
                        thumbnailUrl
                        lowResolutionUrl
                        medResolutionUrl
                        fullResolutionUrl
                        highResolutionUrl
                        direction
                    }
                    image {
                        url
                        thumbnailUrl
                        lowResolutionUrl
                        medResolutionUrl
                        fullResolutionUrl
                        highResolutionUrl
                        direction
                    }
                    licensor {
                        id
                    }
                    brand {
                        id
                    }
                    series {
                        id
                    }
                }
            }
        }
    }`
}

export const VEVE_GET_LATEST_COLLECTIBLES = async () => {
    console.log(`[ALICE][VEVE] - [GET LATEST COLLECTIBLES]`)

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
            query: getVevelatestCollectiblesQuery(),
        }),
    })
        .then(latest_collectibles => latest_collectibles.json())
        .then(async latest_collectibles => {

            const collectibleTypeList = latest_collectibles.data.collectibleTypeList.edges
            const nanoid = customAlphabet('1234567890abcdef', 5)
            const slug = slugify(`${collectible.node.name} ${collectible.node.rarity} ${collectible.node.editionType} ${nanoid()}`,{ lower: true, strict: true })
            const mcp_base_value = 1
            const mcp_rarity_value = comic.node.rarity === 'COMMON' ? 0 : comic.node.rarity === 'UNCOMMON' ? 0 : comic.node.rarity === 'RARE' ? .25 : comic.node.rarity === 'ULTRA_RARE' ? .5 : comic.node.rarity === 'SECRET_RARE' ? 5.0 : NULL


            collectibleTypeList.map(async (collectible) => {

                try {
                    await prisma.veve_collectibles_tmp.create({
                        data: {
                            collectible_id: collectible.node.id,
                            name: collectible.node.name,
                            slug: slug,
                            mcp_base_value: mcp_base_value,
                            mcp_rarity_value: mcp_rarity_value,
                            mcp_total_value: mcp_base_value + mcp_rarity_value,
                            updatedAt: new Date(),
                            total_likes: collectible.node.totalLikes,
                            is_free: collectible.node.isFree,
                            store_price: collectible.node.storePrice,
                            is_unlimited: collectible.node.isUnlimited,
                            total_issued: collectible.node.totalIssued,
                            total_available: collectible.node.totalAvailable,
                            description: collectible.node.description,
                            rarity: collectible.node.rarity,
                            variety: collectible.node.variety,
                            edition_type: collectible.node.editionType,
                            drop_method: collectible.node.dropMethod,
                            drop_date: collectible.node.dropDate,
                            market_fee: collectible.node.marketFee,
                            total_store_allocation: collectible.node.totalStoreAllocation,
                            background_image_url: collectible.node.backgroundImage?.url,
                            background_image_thumbnail_url: collectible.node.backgroundImage?.thumbnailUrl,
                            background_image_low_resolution_url: collectible.node.backgroundImage?.lowResolutionUrl,
                            background_image_med_resolution_url: collectible.node.backgroundImage?.medResolutionUrl,
                            background_image_full_resolution_url: collectible.node.backgroundImage?.fullResolutionUrl,
                            background_image_high_resolution_url: collectible.node.backgroundImage?.highResolutionUrl,
                            background_image_direction: collectible.node.backgroundImage?.direction,
                            image_url: collectible.node.image?.url,
                            image_thumbnail_url: collectible.node.image?.thumbnailUrl,
                            image_low_resolution_url: collectible.node.image?.lowResolutionUrl,
                            image_med_resolution_url: collectible.node.image?.medResolutionUrl,
                            image_full_resolution_url: collectible.node.image?.fullResolutionUrl,
                            image_high_resolution_url: collectible.node.image?.highResolutionUrl,
                            image_direction: collectible.node.image?.direction,
                            licensor_id: collectible.node.licensor?.id,
                            brand_id: collectible.node.brand?.id,
                            series_id: collectible.node?.series?.id
                        }
                    })
                    console.log(`[SUCCESS][VEVE]: ${collectible.node.name} added to prisma db.`)
                } catch (e) {
                    // console.log('NOPE: ', e)
                    // console.log(`[FAIL][VEVE]: ${collectible.node.name} was not added to prisma db.`, e)
                }

            })

            if (latest_collectibles.data.collectibleTypeList.pageInfo?.hasNextPage){
                console.log('next page is: ', latest_collectibles.data.collectibleTypeList.pageInfo.endCursor)
            }

        })
        .catch(err => console.log('[ERROR][VEVE] Unable to get latest collectibles. '))
}

// VEVE_GET_LATEST_COLLECTIBLES()