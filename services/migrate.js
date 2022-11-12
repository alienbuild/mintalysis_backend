import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

const migrateQuery = `query collectibleTypeList {
    collectibleTypeList(first: 1) {
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
        }
        totalCount
    }
}`

const migrate = () => {
    console.log('Migrating yo.')


}

migrate()