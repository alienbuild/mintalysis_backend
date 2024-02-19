import Stripe from 'stripe';
import {GraphQLError} from "graphql"
import {decodeCursor, encodeCursor} from "../utils/index.js";
import * as cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

const resolvers = {
    Query: {
        me: async (_, __, { userInfo, prisma }) => {
            if (!userInfo) return null
            try {
                return await prisma.User.findUnique({
                    where: {
                        id: userInfo.sub
                    },
                    include: {
                        projects: true,
                        // newsletter_subscriber: true,
                        profile: true
                        // following: true, // TODO: Check why i need to uncomment this for it to work now?
                    }
                })
            } catch (error) {
                console.log('Unable to get user info: ', error)
            }
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
        getUserPreferences: async (_, __, { userInfo, prisma }) => {
            return prisma.user_preferences.findUnique({
                where: {
                    user_id: userInfo.sub
                },
            });
        },
        currentUserSubscription: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }
            return await prisma.user.findUnique({
                where: {id: userInfo.sub},
            });
        },
        subscriptionPlans: async (_, __, { prisma }) => {
            return await prisma.subscription_plan.findMany();
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
        },
        updateUserPreferences: async (_, { preferences }, { userInfo, prisma }) => {
            return prisma.user_preferences.upsert({
                where: { user_id: userInfo.sub },
                update: preferences,
                create: {
                    user_id: userInfo.sub,
                    ...preferences,
                },
            });
        },
        logoutAllOtherSessions: async (_, __, { userInfo, prisma }) => {
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: { sessions_valid_after: new Date() },
            });
            return true;
        },
        deleteUserAccount: async (_, __, { prisma, userInfo }) => {
            if (!userInfo.sub) throw new Error("Authentication required or you can only delete your own account.");

            await prisma.user.update({
                where: { id: userInfo.sub },
                data: {
                    is_deleted: true,
                    deleted_at: new Date(),
                    username: 'Deleted User',
                },
            });

            return true;
        },
        updateUserDetails: async (_, { input }, { prisma, userInfo }) => {

            const { username, avatar, first_name, last_name } = input

            let userDataToUpdate = {};
            if (username) {
                userDataToUpdate.username = username;
            }

            let imageUrl = null;
            if (avatar) {
                const { createReadStream } = await avatar.file;

                try {
                    const result = await new Promise((resolve, reject) => {
                        createReadStream().pipe(cloudinary.v2.uploader.upload_stream((error, result) => {
                            if (error) {
                                reject(error);
                            }
                            resolve(result);
                        }));
                    });

                    imageUrl = result.secure_url;
                    userDataToUpdate.avatar = imageUrl;
                } catch (error) {
                    console.error('Error uploading avatar to Cloudinary:', error);
                    throw new Error('There was an issue uploading your avatar.');
                }
            }

            if (Object.keys(userDataToUpdate).length > 0) {
                await prisma.user.update({
                    where: { id: userInfo.sub },
                    data: userDataToUpdate,
                });
            }

            let profileDataToUpdate = {};
            if (first_name) {
                profileDataToUpdate.first_name = first_name;
            }
            if (last_name) {
                profileDataToUpdate.last_name = last_name;
            }

            const profileExists = await prisma.profile.findUnique({
                where: { user_id: userInfo.sub },
            });

            if (profileExists && Object.keys(profileDataToUpdate).length > 0) {
                await prisma.profile.update({
                    where: { user_id: userInfo.sub },
                    data: profileDataToUpdate,
                });
            } else if (!profileExists) {
                await prisma.profile.create({
                    data: { user_id: userInfo.sub, ...profileDataToUpdate },
                });
            }

            return {
                success: true,
                message: 'User details updated successfully',
            };

        },
        createSubscription: async (_, { stripeToken, priceId }, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_customer_id) {
                // Create a new Stripe customer
                const customer = await stripe.customers.create({
                    email: user.email,
                    source: stripeToken,
                });

                // Save the customer ID in your database
                await prisma.user.update({
                    where: { id: userInfo.sub },
                    data: { stripe_customer_id: customer.id },
                });
            }

            // Create the subscription
            const subscription = await stripe.subscriptions.create({
                customer: user.stripe_customer_id,
                items: [{ price: priceId }],
            });

            // Update the user record with subscription details
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: {
                    stripe_subscription_id: subscription.id,
                    subscription_status: subscription.status,
                },
            });

            return {
                success: true,
                message: "Subscription created successfully",
                user: await prisma.user.findUnique({ where: { id: userInfo.sub } }),
            };
        },
        cancelSubscription: async (_, __, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_subscription_id) {
                throw new Error("No subscription found");
            }

            // Cancel the subscription
            await stripe.subscriptions.del(user.stripe_subscription_id);

            // Update the user's subscription status
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: { subscription_status: 'canceled' },
            });

            return {
                success: true,
                message: "Subscription canceled successfully",
                user: await prisma.user.findUnique({ where: { id: userInfo.sub } }),
            };
        },
        changeSubscriptionPlan: async (_, { newPriceId }, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_subscription_id) {
                throw new Error("No subscription found to update");
            }

            // Retrieve the current subscription
            const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

            // Update the subscription to the new plan
            const updatedSubscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId,
                }],
            });

            // Update user's subscription status (optional)
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: { subscription_status: updatedSubscription.status },
            });

            return {
                success: true,
                message: "Subscription plan changed successfully",
                user: await prisma.user.findUnique({ where: { id: userInfo.sub } }),
            };
        },
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
    },
}

export default resolvers

