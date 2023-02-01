import {PrismaClient} from "@prisma/client"
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdef', 5)
import slugify from 'slugify'

const prisma = new PrismaClient()


const generateCollectibleSlugs = async () => {

    const collectibles = await prisma.veve_collectibles.findMany({
        select: {
            collectible_id: true,
            name: true,
            rarity: true,
            edition_type: true
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    collectibles.map(async(collectible, index) => {

        const slug = slugify(`${collectible.name} ${collectible.rarity} ${collectible.edition_type} ${nanoid()}`,{ lower: true, strict: true })

        await prisma.veve_collectibles.update({
            where: {
                collectible_id: collectible.collectible_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${collectible.collectible_id} slug to ${slug}`)

    })

}

const generateComicSlugs = async () => {

    const comics = await prisma.veve_comics.findMany({
        select: {
            unique_cover_id: true,
            name: true,
            rarity: true,
            comic_number: true,
            start_year: true
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    comics.map(async(comic, index) => {
        const slug = slugify(`${comic.name} ${comic.comic_number} ${comic.rarity} ${comic.start_year} ${nanoid()}`,{ lower: true, strict: true })
        await prisma.veve_comics.update({
            where: {
                unique_cover_id: comic.unique_cover_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${comic.unique_cover_id} slug to ${slug}`)

    })

}

const generateBrandSlugs = async () => {

    const brands = await prisma.veve_brands.findMany({
        select: {
            brand_id: true,
            name: true,
        }
    })

    //newCollectible.slug = slugify(collectible.node.name + '-' + new Date().getTime()).toLowerCase()

    brands.map(async(brand, index) => {
        // if (index > 0) return
        const slug = slugify(`${brand.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_brands.update({
            where: {
                brand_id: brand.brand_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${brand.brand_id} slug to ${slug}`)

    })

}

const generateSeriesSlugs = async () => {

    const seriesGroup = await prisma.veve_series.findMany({
        select: {
            series_id: true,
            name: true,
            season: true
        }
    })

    seriesGroup.map(async(series, index) => {
        // if (index > 0) return
        const slug = slugify(`${series.name} season-${series.season}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_series.update({
            where: {
                series_id: series.series_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${series.series_id} slug to ${slug}`)

    })

}

const generateLicensorsSlugs = async () => {

    const licensors = await prisma.veve_licensors.findMany({
        select: {
            licensor_id: true,
            name: true,
        }
    })

    licensors.map(async(licensor, index) => {
        // if (index > 0) return
        const slug = slugify(`${licensor.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.veve_licensors.update({
            where: {
                licensor_id: licensor.licensor_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${licensor.licensor_id} slug to ${slug}`)

    })

}

const generateArtistSlugs = async () => {

    const artists = await prisma.artists.findMany({
        select: {
            artist_id: true,
            name: true,
        }
    })

    artists.map(async(artist, index) => {
        // if (index > 0) return
        const slug = slugify(`${artist.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.artists.update({
            where: {
                artist_id: artist.artist_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${artist.artist_id} slug to ${slug}`)

    })

}

const generateCharacterSlugs = async () => {

    const characters = await prisma.characters.findMany({
        select: {
            character_id: true,
            name: true,
        }
    })

    characters.map(async(character, index) => {
        // if (index > 0) return
        const slug = slugify(`${character.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.characters.update({
            where: {
                character_id: character.character_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${character.character_id} slug to ${slug}`)

    })

}

const generateWriterSlugs = async () => {

    const writers = await prisma.writers.findMany({
        select: {
            author_id: true,
            name: true,
        }
    })

    writers.map(async(writer, index) => {
        // if (index > 0) return
        const slug = slugify(`${writer.name}`,{ lower: true, strict: true })
        // console.log('slug will be: ', slug)
        await prisma.writers.update({
            where: {
                author_id: writer.author_id
            },
            data: {
                slug: slug
            }
        })

        console.log(`updated ${writer.author_id} slug to ${slug}`)

    })

}

generateWriterSlugs()