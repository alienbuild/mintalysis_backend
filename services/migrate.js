import fetch from 'node-fetch'
import HttpsProxyAgent from "https-proxy-agent"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

// Setup proxy
const proxy_string = process.env.PROXY
const proxy_parts = proxy_string.split(':')
const ip_address = proxy_parts[0]
const port = proxy_parts[1]
const username = proxy_parts[2]
const password = proxy_parts[3]

const proxyAgent = new HttpsProxyAgent(`http://${username}:${password}@${ip_address}:${port}`)

const getComicsQuery = `query marketListingByComicCover {
    marketListingByComicCover {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges {
            node {
                rarity
                totalIssued
                image {
                    id
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                comicType {
                    id
                    name
                    isFree
                    storePrice
                    isUnlimited
                    totalIssued
                    totalAvailable
                    description
                    dropDate
                    dropMethod
                    minimumAge
                    startYear
                    comicNumber
                    pageCount
                    comicSeries {
                        id
                        publisher {
                            id
                            marketFee
                        }
                    }
                    artists {
                        edges{
                            node{
                                id
                                name
                            }
                            cursor
                        }
                        totalCount
                    }
                    characters {
                        edges {
                            node{
                                id
                                name
                            }
                        }
                        totalCount
                    }
                    writers {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                        totalCount
                    }
                }
            }
            cursor
        }
        totalCount
    }
}`

const getCollectiblesQuery = `query collectibleTypeList {
    collectibleTypeList(first:50, after: "YXJyYXljb25uZWN0aW9uOjY0OQ==") {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges{
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
            cursor
        }
        totalCount
    }
}`

const getLicensorsQuery = `query licensorList {
    licensorList {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges {
            node {
                id
                name
                description
                marketFee
                themeLogoImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeBackgroundImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeFooterImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                landscapeImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                squareImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
            }
            cursor
        }
        totalCount
    }
}`

const getBrandsQuery = `query brandList {
    brandList {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges {
            node {
                id
                name
                description
                themeLogoImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeBackgroundImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeFooterImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                landscapeImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                squareImage {
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
            }
        }
    }
}`

const getSeriesQuery = `query seriesList {
    seriesList {
        pageInfo {
            endCursor
            hasNextPage
        }
        edges {
            node {
                id
                name
                description
                season
                isBlindbox
                themeLogoImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeBackgroundImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                themeFooterImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                landscapeImage {
                    url
                    thumbnailUrl
                    lowResolutionUrl
                    medResolutionUrl
                    fullResolutionUrl
                    highResolutionUrl
                    direction
                }
                squareImage {
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
            }
            cursor
        }
        totalCount
    }
}`

const migrateLicensors = () => {
    console.log('Migrating.')

    fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({ query: getLicensorsQuery }),
    })
        .then(data => data.json())
        .then(data => {

            const licensorList = data.data.licensorList.edges

            licensorList.map(async (licensor) => {

                const licensorObj = await prisma.veve_licensors.create({
                    data: {
                        licensor_id: licensor.node.id,
                        name: licensor.node.name,
                        description: licensor.node.description,
                        market_fee: licensor.node.marketFee,
                        theme_logo_image_url: licensor.node.themeLogoImage?.url,
                        theme_logo_image_thumbnail_url: licensor.node.themeLogoImage?.thumbnailUrl,
                        theme_logo_image_low_resolution_url: licensor.node.themeLogoImage?.lowResolutionUrl,
                        theme_logo_image_med_resolution_url: licensor.node.themeLogoImage?.medResolutionUrl,
                        theme_logo_image_full_resolution_url: licensor.node.themeLogoImage?.fullResolutionUrl,
                        theme_logo_image_high_resolution_url: licensor.node.themeLogoImage?.highResolutionUrl,
                        theme_logo_image_direction: licensor.node.themeLogoImage?.direction,
                        theme_background_image_url: licensor.node.themeBackgroundImage?.url,
                        theme_background_image_thumbnail_url: licensor.node.themeBackgroundImage?.thumbnailUrl,
                        theme_background_image_low_resolution_url: licensor.node.themeBackgroundImage?.lowResolutionUrl,
                        theme_background_image_med_resolution_url: licensor.node.themeBackgroundImage?.medResolutionUrl,
                        theme_background_image_full_resolution_url: licensor.node.themeBackgroundImage?.fullResolutionUrl,
                        theme_background_image_high_resolution_url: licensor.node.themeBackgroundImage?.highResolutionUrl,
                        theme_background_image_direction: licensor.node.themeBackgroundImage?.direction,
                        theme_footer_image_url: licensor.node.themeFooterImage?.url,
                        theme_footer_image_thumbnail_url: licensor.node.themeFooterImage?.thumbnailUrl,
                        theme_footer_image_low_resolution_url: licensor.node.themeFooterImage?.lowResolutionUrl,
                        theme_footer_image_med_resolution_url: licensor.node.themeFooterImage?.medResolutionUrl,
                        theme_footer_image_full_resolution_url: licensor.node.themeFooterImage?.fullResolutionUrl,
                        theme_footer_image_high_resolution_url: licensor.node.themeFooterImage?.highResolutionUrl,
                        theme_footer_image_direction: licensor.node.themeFooterImage?.direction,
                        landscape_image_url: licensor.node.landscapeImage?.url,
                        landscape_image_thumbnail_url: licensor.node.landscapeImage?.thumbnailUrl,
                        landscape_image_low_resolution_url: licensor.node.landscapeImage?.lowResolutionUrl,
                        landscape_image_med_resolution_url: licensor.node.landscapeImage?.medResolutionUrl,
                        landscape_image_full_resolution_url: licensor.node.landscapeImage?.fullResolutionUrl,
                        landscape_image_high_resolution_url: licensor.node.landscapeImage?.highResolutionUrl,
                        landscape_image_direction: licensor.node.landscapeImage?.direction,
                        square_image_url: licensor.node.squareImage?.url,
                        square_image_thumbnail_url: licensor.node.squareImage?.thumbnailUrl,
                        square_image_low_resolution_url: licensor.node.squareImage?.lowResolutionUrl,
                        square_image_med_resolution_url: licensor.node.squareImage?.medResolutionUrl,
                        square_image_full_resolution_url: licensor.node.squareImage?.fullResolutionUrl,
                        square_image_high_resolution_url: licensor.node.squareImage?.highResolutionUrl,
                        square_image_direction: licensor.node.squareImage?.direction,
                    }
                })

                if (!licensorObj){
                        console.log('Nope failed.')
                } else {
                    console.log('Success.')
                }

            })

        })
        .catch(err => console.log('[ERROR] Denied: ', err))
}

const migrateBrands = () => {
    console.log('Migrating.')

    fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({ query: getBrandsQuery }),
    })
        .then(data => data.json())
        .then(data => {

            const brandList = data.data.brandList.edges

            brandList.map(async (brand) => {

                const brandObj = await prisma.veve_brands.create({
                    data: {
                        brand_id: brand.node.id,
                        name: brand.node.name,
                        description: brand.node.description,
                        theme_logo_image_url: brand.node.themeLogoImage?.url,
                        theme_logo_image_thumbnail_url: brand.node.themeLogoImage?.thumbnailUrl,
                        theme_logo_image_low_resolution_url: brand.node.themeLogoImage?.lowResolutionUrl,
                        theme_logo_image_med_resolution_url: brand.node.themeLogoImage?.medResolutionUrl,
                        theme_logo_image_full_resolution_url: brand.node.themeLogoImage?.fullResolutionUrl,
                        theme_logo_image_high_resolution_url: brand.node.themeLogoImage?.highResolutionUrl,
                        theme_logo_image_direction: brand.node.themeLogoImage?.direction,
                        theme_background_image_url: brand.node.themeBackgroundImage?.url,
                        theme_background_image_thumbnail_url: brand.node.themeBackgroundImage?.thumbnailUrl,
                        theme_background_image_low_resolution_url: brand.node.themeBackgroundImage?.lowResolutionUrl,
                        theme_background_image_med_resolution_url: brand.node.themeBackgroundImage?.medResolutionUrl,
                        theme_background_image_full_resolution_url: brand.node.themeBackgroundImage?.fullResolutionUrl,
                        theme_background_image_high_resolution_url: brand.node.themeBackgroundImage?.highResolutionUrl,
                        theme_background_image_direction: brand.node.themeBackgroundImage?.direction,
                        theme_footer_image_url: brand.node.themeFooterImage?.url,
                        theme_footer_image_thumbnail_url: brand.node.themeFooterImage?.thumbnailUrl,
                        theme_footer_image_low_resolution_url: brand.node.themeFooterImage?.lowResolutionUrl,
                        theme_footer_image_med_resolution_url: brand.node.themeFooterImage?.medResolutionUrl,
                        theme_footer_image_full_resolution_url: brand.node.themeFooterImage?.fullResolutionUrl,
                        theme_footer_image_high_resolution_url: brand.node.themeFooterImage?.highResolutionUrl,
                        theme_footer_image_direction: brand.node.themeFooterImage?.direction,
                        landscape_image_url: brand.node.landscapeImage?.url,
                        landscape_image_thumbnail_url: brand.node.landscapeImage?.thumbnailUrl,
                        landscape_image_low_resolution_url: brand.node.landscapeImage?.lowResolutionUrl,
                        landscape_image_med_resolution_url: brand.node.landscapeImage?.medResolutionUrl,
                        landscape_image_full_resolution_url: brand.node.landscapeImage?.fullResolutionUrl,
                        landscape_image_high_resolution_url: brand.node.landscapeImage?.highResolutionUrl,
                        landscape_image_direction: brand.node.landscapeImage?.direction,
                        square_image_url: brand.node.squareImage?.url,
                        square_image_thumbnail_url: brand.node.squareImage?.thumbnailUrl,
                        square_image_low_resolution_url: brand.node.squareImage?.lowResolutionUrl,
                        square_image_med_resolution_url: brand.node.squareImage?.medResolutionUrl,
                        square_image_full_resolution_url: brand.node.squareImage?.fullResolutionUrl,
                        square_image_high_resolution_url: brand.node.squareImage?.highResolutionUrl,
                        square_image_direction: brand.node.squareImage?.direction,
                        licensor_id: brand.node.licensor?.id
                    }
                })

                if (!brandObj){
                    console.log('Nope failed.')
                } else {
                    console.log('Success.')
                }

            })

        })
        .catch(err => console.log('[ERROR] Denied: ', err))
}

const migrateSeries = () => {
    console.log('Migrating.')

    fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({ query: getSeriesQuery }),
    })
        .then(data => data.json())
        .then(data => {
            const seriesList = data.data.seriesList.edges
            seriesList.map(async (series) => {

                const seriesObj = await prisma.veve_series.create({
                    data: {
                        series_id: series.node.id,
                        name: series.node.name,
                        description: series.node.description,
                        season: series.node.season,
                        is_blindbox: series.node.isBlindbox,
                        theme_logo_image_url: series.node.themeLogoImage?.url,
                        theme_logo_image_thumbnail_url: series.node.themeLogoImage?.thumbnailUrl,
                        theme_logo_image_low_resolution_url: series.node.themeLogoImage?.lowResolutionUrl,
                        theme_logo_image_med_resolution_url: series.node.themeLogoImage?.medResolutionUrl,
                        theme_logo_image_full_resolution_url: series.node.themeLogoImage?.fullResolutionUrl,
                        theme_logo_image_high_resolution_url: series.node.themeLogoImage?.highResolutionUrl,
                        theme_logo_image_direction: series.node.themeLogoImage?.direction,
                        theme_background_image_url: series.node.themeBackgroundImage?.url,
                        theme_background_image_thumbnail_url: series.node.themeBackgroundImage?.thumbnailUrl,
                        theme_background_image_low_resolution_url: series.node.themeBackgroundImage?.lowResolutionUrl,
                        theme_background_image_med_resolution_url: series.node.themeBackgroundImage?.medResolutionUrl,
                        theme_background_image_full_resolution_url: series.node.themeBackgroundImage?.fullResolutionUrl,
                        theme_background_image_high_resolution_url: series.node.themeBackgroundImage?.highResolutionUrl,
                        theme_background_image_direction: series.node.themeBackgroundImage?.direction,
                        theme_footer_image_url: series.node.themeFooterImage?.url,
                        theme_footer_image_thumbnail_url: series.node.themeFooterImage?.thumbnailUrl,
                        theme_footer_image_low_resolution_url: series.node.themeFooterImage?.lowResolutionUrl,
                        theme_footer_image_med_resolution_url: series.node.themeFooterImage?.medResolutionUrl,
                        theme_footer_image_full_resolution_url: series.node.themeFooterImage?.fullResolutionUrl,
                        theme_footer_image_high_resolution_url: series.node.themeFooterImage?.highResolutionUrl,
                        theme_footer_image_direction: series.node.themeFooterImage?.direction,
                        landscape_image_url: series.node.landscapeImage?.url,
                        landscape_image_thumbnail_url: series.node.landscapeImage?.thumbnailUrl,
                        landscape_image_low_resolution_url: series.node.landscapeImage?.lowResolutionUrl,
                        landscape_image_med_resolution_url: series.node.landscapeImage?.medResolutionUrl,
                        landscape_image_full_resolution_url: series.node.landscapeImage?.fullResolutionUrl,
                        landscape_image_high_resolution_url: series.node.landscapeImage?.highResolutionUrl,
                        landscape_image_direction: series.node.landscapeImage?.direction,
                        square_image_url: series.node.squareImage?.url,
                        square_image_thumbnail_url: series.node.squareImage?.thumbnailUrl,
                        square_image_low_resolution_url: series.node.squareImage?.lowResolutionUrl,
                        square_image_med_resolution_url: series.node.squareImage?.medResolutionUrl,
                        square_image_full_resolution_url: series.node.squareImage?.fullResolutionUrl,
                        square_image_high_resolution_url: series.node.squareImage?.highResolutionUrl,
                        square_image_direction: series.node.squareImage?.direction,
                        licensor_id: series.node.licensor?.id,
                        brand_id: series.node.brand?.id
                    }
                })

                if (!seriesObj){
                    console.log('Nope failed.')
                } else {
                    console.log('Success.')
                }

            })
        })
        .catch(err => console.log('[ERROR] Denied: ', err))
}

const migrateCollectibles = () => {
    console.log('Migrating collectibles.')

    fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({ query: getCollectiblesQuery }),
    })
        .then(data => data.json())
        .then(data => {

            console.log('hasNextPage: ', data.data.collectibleTypeList.pageInfo.hasNextPage)
            console.log('totalCount is: ', data.data.collectibleTypeList.totalCount)
            console.log('next cursor is: ', data.data.collectibleTypeList.edges.cursor)
            console.log('end cursor is: ', data.data.collectibleTypeList.pageInfo.endCursor)

            const collectibleTypeList = data.data.collectibleTypeList.edges
            collectibleTypeList.map(async (collectible) => {

                const collectiblesObj = await prisma.veve_collectibles.create({
                    data: {
                        collectible_id: collectible.node.id,
                        name: collectible.node.name,
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
                        series_id: collectible.node.series?.id
                    }
                })

                if (!collectiblesObj){
                    console.log('Nope failed.')
                } else {
                    console.log('Success.')
                }

            })

        })
        .catch(err => console.log('[ERROR] Denied: ', err))
}

const migrateComics = () => {
    console.log('Migrating collectibles.')

    fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({ query: getComicsQuery }),
    })
        .then(data => data.json())
        .then(data => {
            // console.log('data is: ', data.data.marketListingByComicCover.edges)
            console.log('hasNextPage: ', data.data.marketListingByComicCover.pageInfo.hasNextPage)
            console.log('totalCount is: ', data.data.marketListingByComicCover.totalCount)
            console.log('next cursor is: ', data.data.marketListingByComicCover.edges.cursor)
            console.log('end cursor is: ', data.data.marketListingByComicCover.pageInfo.endCursor)

            const marketListingByComicCover = data.data.marketListingByComicCover.edges
            marketListingByComicCover.map(async (comic, index) => {
                // if (index > 0) return null
                let writersArr = []
                let artistsArr = []
                let charactersArr = []

                try {
                    comic.node.comicType.writers.edges.map(async (writer) => {
                        writersArr.push({
                            where: { author_id: writer.node.id },
                            create: { author_id: writer.node.id, name: writer.node.name },
                        })
                        // await prisma.veve_comic_writers.upsert({
                        //     where: {
                        //         author_id: writer.node.id
                        //     },
                        //     update: {},
                        //     create: {
                        //         author_id: writer.node.id,
                        //         name: writer.node.name
                        //     }
                        // })
                    })

                    comic.node.comicType.artists.edges.map(async (artist) => {
                        artistsArr.push({
                            where: { artist_id: artist.node.id },
                            create: { artist_id: artist.node.id, name: artist.node.name },
                        })
                        // await prisma.veve_comic_artists.upsert({
                        //     where: {
                        //         artist_id: artist.node.id
                        //     },
                        //     update: {},
                        //     create: {
                        //         artist_id: artist.node.id,
                        //         name: artist.node.name
                        //     }
                        // })
                    })

                    comic.node.comicType.characters.edges.map(async (character) => {
                        charactersArr.push({
                            where: { character_id: character.node.id },
                            create: { character_id: character.node.id, name: character.node.name },
                        })
                        // await prisma.veve_comic_characters.upsert({
                        //     where: {
                        //         character_id: character.node.id
                        //     },
                        //     update: {},
                        //     create: {
                        //         character_id: character.node.id,
                        //         name: character.node.name
                        //     }
                        // })
                    })
                } catch (error) {
                    console.log('[ERROR] Unable to save comic collaborators. ', error)
                }

                try {
                    const comicsObj = await prisma.veve_comics.create({
                        data: {
                            uniqueCoverId: comic.node.image.id,
                            name: comic.node.comicType.name,
                            rarity: comic.node.rarity,
                            description: comic.node.comicType.description,
                            comic_number: Number(comic.node.comicType.comicNumber),
                            comic_series_id: comic.node.comicType.comicSeries.id,
                            image_thumbnail: comic.node.image.thumbnailUrl,
                            image_low_resolution_url: comic.node.image.lowResolutionUrl,
                            image_med_resolution_url: comic.node.image.medResolutionUrl,
                            image_full_resolution_url: comic.node.image.fullResolutionUrl,
                            image_high_resolution_url: comic.node.image.highResolutionUrl,
                            image_direction: comic.node.image.direction,
                            drop_date: comic.node.comicType.dropDate,
                            drop_method: comic.node.comicType.dropMethod,
                            start_year: comic.node.comicType.startYear,
                            page_count: comic.node.comicType.pageCount,
                            store_price: comic.node.comicType.storePrice,
                            publisher_id: comic.node.comicType.comicSeries.publisher.id,
                            market_fee: comic.node.comicType.comicSeries.publisher.marketFee,
                            total_issued: comic.node.totalIssued,
                            total_available: comic.node.comicType.totalAvailable,
                            is_free: comic.node.comicType.isFree,
                            is_unlimited: comic.node.comicType.isUnlimited,
                            writers: {
                                connectOrCreate: writersArr,
                            },
                            artists: {
                                connectOrCreate: artistsArr,
                            },
                            characters: {
                                connectOrCreate: charactersArr,
                            }
                        }
                    })
                    if (!comicsObj){
                        console.log('Nope failed.')
                    } else {
                        console.log(`[SUCCESS] ${comic.node.comicType.name} / Rarity ${comic.node.rarity}`)
                    }
                } catch (e) {
                    console.log(`[ERROR] Cover ID: ${comic.node.image.id} / Name : ${comic.node.comicType.name} / Rarity: ${comic.node.rarity} `)
                }

            })

        })
        .catch(err => console.log('[ERROR] Denied: ', err))
}

migrateComics()