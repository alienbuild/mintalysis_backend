import * as cloudinary from "cloudinary"
import {GraphQLError} from "graphql"
import {decodeCursor, encodeCursor} from "../utils/index.js";

const resolvers = {
    Query: {
        me: async (_, __, {userInfo, prisma}) => {
            if (!userInfo) return null
            return await prisma.User.findUnique({
                where: {
                    id: userInfo.sub
                },
                include: {
                    projects: true,
                    newsletter_subscriber: true,
                    profile: {
                        include: {
                            veve_wallet: true
                        }
                    }
                    // following: true, // TODO: Check why i need to uncomment this for it to work now?
                }
            })
        },
        getUser: async (_, { userId }, {prisma, userInfo}) => {

            const isMyProfile = userId === userInfo?.sub

            try {

                const user = await prisma.User.findUnique({
                    where: {
                        id: userId
                    },
                    include: {
                        // projects: true,
                        // profile: true,
                        followers: {
                            select: {
                                follower: {
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
                                following: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                followers: true,
                                following: true,
                                // projects: true
                            }
                        }
                    }
                })

                if (!user) return null

                const check = await prisma.follows.findFirst({
                    where: {
                        followingId: user.id,
                        followerId: userInfo?.sub
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
        getUsers: async (_, { pagingOptions, sortOptions }, { prisma, userInfo}) => {

            let limit = 20
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 100) return null

            let queryParams = { take: limit }
            if (pagingOptions && pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { id: decodeCursor(pagingOptions.after) } }

            try {
                const users = await prisma.User.findMany(queryParams)

                return {
                    edges: users,
                    pageInfo: {
                        endCursor: users.length > 1 ? encodeCursor(users[users.length - 1].id) : null
                    },
                    totalCount: await prisma.User.count()
                }
            } catch (e) {
                throw new GraphQLError('Unable to get users')
            }

        },
        searchUsers: async (_, { username: searchedUsername }, { prisma, userInfo }) => {

            if (!userInfo) throw new GraphQLError('Not authorised')

            const { username: myUsername } = userInfo
            
            try {
                return await prisma.User.findMany({
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
        getUserFollowing: async (_, { userId, type = "followers" }, { prisma, userInfo }) => {

            let select
            if (type === 'followers') {
                select = {
                    followers: {
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
            } else {
                select = {
                    following: {
                        select: {
                            following: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                }
            }

            try {
                return await prisma.User.findUnique({
                    where: {
                        id: userId,
                    },
                    select
                })
            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
        getUserCommunities: async (_, { userId }, { userInfo, prisma }) => {

            console.log('hit: ', userId)

            try {
                const test = await prisma.User.findUnique({
                    where:{
                        id: userId
                    },
                    select: {
                        communities: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                slug: true,
                                image: true,
                                member_count: true,
                                createdAt: true
                            }
                        }
                    }
                })

                console.log('test is: ', test)

                return test.communities
            } catch (e) {
                console.log('nah: ', e)
                throw new GraphQLError('Not authorised.')
            }

        },
        getUserProjects: async (_, { userId }, { userInfo, prisma }) => {

            try {

                const test = await prisma.User.findUnique({
                    where: {
                        id: userId
                    },
                    select: {
                        projects: true,
                    }
                })

                console.log('projects and count: ', test)

                return true

            } catch (e) {
                console.log('nah: ', e)
            }

        },
        getUserAccessibilityPreferences: async (_, __, { userInfo, prisma }) => {
            if (!userInfo.sub) throw new GraphQLError('Unauthorised.')

            try {
                return await prisma.users_preferences_accessibility.findUnique({
                    where: {
                        user_id: userInfo.sub
                    }
                })

            } catch (e) {
                throw new GraphQLError('Unable to get user accessibility preferences.')
            }

        },
        checkUsername: async (_, { username }, { userInfo, prisma }) => {
            const user = await prisma.user.findUnique({
                where: {
                    username
                }
            });

            return user === null
        },
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

                console.log('avatar result is: ', result)

                // TODO: Remove users old image from cloudinary to free up space.
                // TODO: Add Amazons Image Rekognition to cloudinary for image moderation (nudity prevention etc)
                // https://cloudinary.com/documentation/aws_rekognition_ai_moderation_addon
                const user = await prisma.profile.update({
                    data: {
                        avatar: result.secure_url
                    },
                    where: {
                        user_id: userInfo.sub
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

            await prisma.User.update({
                where: {
                    id: userInfo.sub
                },
                data: {
                    last_seen
                }
            })

            return true
        },
        followUser: async (_, { userId }, { userInfo, prisma }) => {

            if (!userInfo) throw new GraphQLError('Not authorised.')
            if (userId === userInfo.sub) throw new GraphQLError('You can not follow yourself.')

            try {
                return await prisma.follows.create({
                    data: {
                        followerId: userInfo.sub,
                        followingId: userId
                    }
                })
            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
        unfollowUser: async (_, { userId }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorised.')
            if (userId === userInfo.sub) throw new GraphQLError('You can not unfollow yourself.')

            try {
                return await prisma.follows.delete({
                    where: {
                        followerId: userInfo.sub,
                        followingId: userId
                    }
                })
            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
        saveUserAccessibilityPreferences: async (_, {preferences}, { userInfo, prisma }) => {
            if (!userInfo.sub) throw new GraphQLError('Unauthorised.')

            try {

                await prisma.users_preferences_accessibility.upsert({
                    where: {
                        user_id: userInfo.sub
                    },
                    update: preferences,
                    create: {
                        ...preferences,
                        user_id: userInfo.sub
                    },
                })

                // await prisma.users_preferences_accessibility.update({
                //     where:{
                //         user_id: userInfo.sub
                //     },
                //     data: preferences,
                // })

                return true
            } catch (e) {
                console.log('error: ', e)
                throw new GraphQLError('Unable to save user accessibility preferences.')
            }

        },
        updateUsername: async (_, { username }, { userInfo, prisma }) => {

            console.log('update is: ', username)
            return true
        }
    },
    Subscription: {
        userStatusChanged: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['USER_STATUS_CHANGED'])
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


            const collectibles = await prisma.User.findUnique({
                where: {
                    id: userInfo.sub
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

