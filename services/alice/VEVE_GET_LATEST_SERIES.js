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

const getVeveLatestSeriesQuery = () => `query seriesList {
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

export const VEVE_GET_LATEST_SERIES = async () => {
    console.log(`[ALICE][VEVE] - [GET LATEST SERIES]`)

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
            query: getVeveLatestSeriesQuery(),
        }),
    })
        .then(latest_series => latest_series.json())
        .then(async latest_series => {

            const seriesList = latest_series.data.seriesList.edges
            seriesList.map(async (series) => {

                try {
                    await prisma.veve_series.create({
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
                    console.log(`[FAIL][VEVE][SERIES]: ${series.node.name} was added to prisma db.`)
                } catch (e) {
                    console.log(`[FAIL][VEVE][SERIES]: ${series.node.name} was not added to prisma db.`)
                }

            })

        })
        .catch(err => console.log('[ERROR][VEVE][SERIES] Unable to get latest series. ', err))
}