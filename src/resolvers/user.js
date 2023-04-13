import * as cloudinary from "cloudinary"
import {GraphQLError} from "graphql"
import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        me: async (_, __, {userInfo, prisma}) => {
            if (!userInfo) return null
            return await prisma.users.findUnique({
                where: {
                    id: userInfo.userId
                },
                include: {
                    projects: true,
                    profile: {
                        include: {
                            veve_wallet: true
                        }
                    }
                    // following: true, // TODO: Check why i need to uncomment this for it to work now?
                }
            })
        },
        getUser: async (_, { username }, {prisma, userInfo}) => {

            const isMyProfile = username === userInfo?.userId

            try {

                const user = await prisma.users.findUnique({
                    where: {
                        username: username
                    },
                    include: {
                        projects: true,
                        profile: true,
                        followers: {
                            select: {
                                following: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        },
                        following: {
                            select: {
                                follower: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                })

                console.log('user is: ', user)

                if (!user) return null

                const check = await prisma.follows.findFirst({
                    where: {
                        followingId: userInfo.userId,
                        followerId: user.id
                    }
                })

                return {
                    user: user,
                    isMyProfile,
                    userIsFollowing: !!check
                }

            } catch (e) {
                console.log('boerwersdfsdf : ', e)
                throw new GraphQLError('Not authorised.')
            }

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
                    },
                    take: 10
                })

            } catch (error) {
                throw new GraphQLError(error?.message)
            }

        },
        getUsers: async (_, __, { prisma, userInfo}) => {

            return await prisma.users.findMany({})
        },
        getUserFollowing: async (_, { userId }, { prisma, userInfo }) => {

            // if (!userInfo) throw new GraphQLError('Not authorised.')

            try {
                return await prisma.users.findUnique({
                    where: {
                        id: userId,
                    },
                    include: {
                        following: true,
                        followers: true
                    },
                })
            } catch (e) {
                throw new GraphQLError('Not authorised.')
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


        },
        updateLastSeen: async (_, { last_seen }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')

            await prisma.users.update({
                where: {
                    id: userInfo.userId
                },
                data: {
                    last_seen
                }
            })

            return true
        },
        followUser: async (_, { userId }, { userInfo, prisma }) => {

            if (!userInfo) throw new GraphQLError('Not authorised.')

            try {
                await prisma.follows.create({
                    data: {
                        follower: { connect: { id: userInfo.userId } },
                        following: { connect: { id: userId } },
                    }
                })

                return true
            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        }
    },
    Subscription: {
        getOnlineUsers: async (_, __, { userInfo, prisma }) => {

            return []
        }
    },
    User : {
        // profile: (parent, __, { prisma }) => {
        //     return prisma.profile.findUnique({
        //         where: {
        //             user_id: parent.id
        //         }
        //     })
        // },
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

