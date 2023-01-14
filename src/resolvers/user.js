import {validateVeveUsername} from "../utils/validateVeveUsername.js"
import * as cloudinary from "cloudinary"
import { GraphQLError } from "graphql"
import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        me: (_, __, { userInfo, prisma }) => {
            if (!userInfo) return null
            return prisma.users.findUnique({
                where: {
                    id: userInfo.userId
                },
                include: {
                    projects: true,
                    // veve_collectibles: true
                }
            })
        },
        profile: async (_, {userId}, {prisma, userInfo}) => {

            const isMyProfile = Number(userId) === userInfo?.userId

            const profile = await prisma.profile.findUnique({
                where: {
                    user_id: Number(userId)
                }
            })

            if (!profile) return null

            return {
                ...profile,
                isMyProfile
            }
        },
        validateVeveUsername: async (_, {username}, ___) => {
            let returnArr = []
            try {
                const userList = await validateVeveUsername(username)
                userList.edges.map((user) => {
                    returnArr.push(user.node.username)
                })
            } catch (err) {
                console.log('[ERROR] Fetching user list from VEVE api: ', err)
            }

            return returnArr
        },
        searchUsers: async (_, { username: searchedUsername }, { prisma, userInfo }) => {

            if (!userInfo) throw new GraphQLError('Not authorised')

            const { username: myUsername } = userInfo
            
            try {
                return await prisma.users.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: myUsername,
                        }
                    }
                })

            } catch (error) {
                throw new GraphQLError(error?.message)
            }

        }
    },
    Mutation: {
        avatarUpload: async (_, { file }, { userInfo, prisma }) => {

            const { createReadStream } = await file.file

            cloudinary.v2.config({
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            })

            try{
                const result = await new Promise((resolve, reject) => {
                    createReadStream().pipe(cloudinary.v2.uploader.upload_stream((error, result) => {
                        if (error) {
                            reject(error)
                        }

                        resolve(result)
                    }))
                })

                // TODO: Remove users old image from cloudinary to free up space.
                // TODO: Add Amazons Image Rekognition to cloudinary for image moderation (nudity prevention etc)
                // https://cloudinary.com/documentation/aws_rekognition_ai_moderation_addon
                const user = await prisma.profile.update({
                    data: {
                        avatar: result.secure_url
                    },
                    where: {
                        user_id: userInfo.userId
                    }
                })

                if (!user){
                    return {
                        success: false,
                        message: 'File upload failed as the user was not found.',
                    }
                } else {
                    return {
                        success: true,
                        message: 'File upload success.',
                        token: result.secure_url
                    }
                }

            } catch (e) {
                throw new GraphQLError('There was an issue uploading your avatar.')
            }


        }
    },
    User : {
        profile: (parent, __, { prisma }) => {
            return prisma.profile.findUnique({
                where: {
                    user_id: parent.id
                }
            })
        },
        veve_collectibles: async (parent, { sortOptions, pagingOptions }, {userInfo, prisma}) => {
            let limit = 25
            let sortParams = { drop_date: 'asc' }
            let queryParams = {}

            if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }

            if (pagingOptions){
                console.log('pagingOptions is: ', pagingOptions)
                console.log('pagingOptions is: ', pagingOptions.after)
                if (pagingOptions.limit) limit = pagingOptions.limit
                if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(pagingOptions.after) }}
            }

            queryParams = { ...queryParams, take: limit, orderBy: [sortParams] }


            const collectibles = await prisma.users.findUnique({
                where: {
                    id: userInfo.userId
                },
                include: {
                    veve_collectibles: queryParams,
                    _count: {
                        select: { veve_collectibles: true },
                    }
                }
            })

            const totalCount = collectibles._count.veve_collectibles

            return {
                edges: collectibles.veve_collectibles,
                totalCount: totalCount,
                pageInfo:{
                    endCursor: collectibles.veve_collectibles.length > 1 ? encodeCursor(collectibles.veve_collectibles[collectibles.veve_collectibles.length - 1].collectible_id) : null
                }
            }

        }
    }
}

export default resolvers

