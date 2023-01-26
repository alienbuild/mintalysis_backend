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

const getVeveLatestBrandsQuery = () => `query brandList {
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

export const VEVE_GET_LATEST_BRANDS = async () => {
    console.log(`[ALICE][VEVE] - [GET LATEST BRANDS]`)

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
            query: getVeveLatestBrandsQuery(),
        }),
    })
        .then(latest_brands => latest_brands.json())
        .then(async latest_brands => {

            const brandList = latest_brands.data.brandList.edges
            brandList.map(async (brand) => {
                try {

                    await prisma.veve_brands.create({
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
                    console.log(`[SUCCESS][VEVE][BRAND]: ${brand.node.name} was added to prisma db.`)

                } catch (e) {
                    console.log(`[FAIL][VEVE][BRAND]: ${brand.node.name} was not added to prisma db.`)
                }
            })

        })
        .catch(err => console.log('[ERROR][VEVE][BRANDS] Unable to get latest brands. ', err))

}