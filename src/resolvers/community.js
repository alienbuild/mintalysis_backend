import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        getCommunity: async (_, { community_name }, { userInfo, prisma }) => {

            let isMember = false
            const community = await prisma.communities.findUnique({
                where: {
                    name: community_name
                },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    type: true,
                    creator_id: true,
                    project_id: true,
                    member_count: true,
                    createdAt: true,
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            last_seen: true,
                            createdAt: true
                        }
                    },
                    members: {
                        take: 10,
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            last_seen: true
                        }
                    },
                    veve_collectible: {
                        select: {
                            collectible_id: true,
                            name: true,
                            rarity: true,
                            description: true,
                            edition_type: true,
                            image_thumbnail_url: true,
                            image_med_resolution_url: true,
                            drop_date: true,
                            market_fee: true,
                            total_issued: true,
                            floor_price: true,
                            market_cap: true,
                            all_time_high: true,
                            all_time_low: true,
                            one_day_change: true,
                            total_listings: true,
                        }
                    }
                }
            })

            if (userInfo) {
                const memberOf = await prisma.users.findUnique({
                    where: {
                        id: userInfo.userId
                    },
                    select: {
                        communities: true
                    }
                })
                if (memberOf.communities){
                    memberOf.communities.map((communityJoined) => {
                        if (communityJoined.id === community.id) {
                            isMember = true
                        }
                    })
                }
            }

            return {
                ...community,
                isMember
            }

        },
        getPosts: async (_, { user_id, community_id, project_id }, { userInfo, prisma }) => {

            let whereParams = {}

            if (user_id) whereParams = { ...whereParams, author_id: user_id }
            if (community_id) whereParams = { ...whereParams, community_id }
            if (project_id) whereParams = { ...whereParams, project_id }

            if (community_id) {
                return await prisma.community_posts.findMany({
                    where: whereParams,
                    select: {
                        id: true,
                        content: true,
                        comment_count: true,
                        like_count: true,
                        createdAt: true,
                        community: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                            }
                        },
                        author: {
                            select: {
                                id: true,
                                username: true,
                                last_seen: true,
                                avatar: true
                            }
                        },
                        liked_by: {
                            where: {
                                id: userInfo.userId
                            },
                            select: {
                                id: true
                            }
                        },
                        comments: {
                            where: {parent_id: null},
                            select: {
                                id: true,
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true,
                                    }
                                },
                                body: true,
                                createdAt: true,
                                updatedAt: true,
                                like_count: true,
                                liked_by: {
                                    where: {
                                        id: userInfo.userId
                                    },
                                    select: {
                                        id: true
                                    }
                                },
                                children: {
                                    include: {
                                        children: true,
                                        author: {
                                            select: {
                                                id: true,
                                                username: true,
                                                avatar: true,
                                                last_seen: true
                                            }
                                        },
                                        liked_by: true
                                    }
                                }
                            },
                            take: 5
                        }
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                })
            } else {
                return await prisma.posts.findMany({
                    where: whereParams,
                    select: {
                        id: true,
                        body: true,
                        comment_count: true,
                        like_count: true,
                        createdAt: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                last_seen: true,
                                avatar: true
                            }
                        },
                        liked_by: {
                            where: {
                                id: userInfo.userId
                            },
                            select: {
                                id: true
                            }
                        },
                        comments: {
                            where: {parent_id: null},
                            select: {
                                id: true,
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true,
                                    }
                                },
                                body: true,
                                createdAt: true,
                                updatedAt: true,
                                like_count: true,
                                liked_by: {
                                    where: {
                                        id: userInfo.userId
                                    },
                                    select: {
                                        id: true
                                    }
                                },
                                children: {
                                    include: {
                                        children: true,
                                        author: {
                                            select: {
                                                id: true,
                                                username: true,
                                                avatar: true,
                                                last_seen: true
                                            }
                                        },
                                        liked_by: true
                                    }
                                }
                            },
                            take: 5
                        }
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                })
            }
        },
        getPost: async (_, { post_id }, { userInfo, prisma}) => {

            const post = await prisma.posts.findUnique({
                where: {
                    id: post_id
                },
                select: {
                    id: true,
                    body: true,
                    comment_count: true,
                    like_count: true,
                    createdAt: true,
                    community: {
                        select: {
                            id: true,
                            slug: true,
                            name: true,
                            creator_id: true,
                            member_count: true,
                            createdAt: true,
                            members: {
                                take: 10,
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true,
                                    last_seen: true
                                }
                            }
                        }
                    },
                    author: {
                        select: {
                            id: true,
                            username: true,
                            last_seen: true,
                            avatar: true
                        }
                    },
                    liked_by: {
                        where: {
                            id: userInfo.userId
                        },
                        select: {
                            id: true
                        }
                    },
                    comments: {
                        select: {
                            id: true,
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true,
                                }
                            },
                            body: true,
                            createdAt: true,
                            updatedAt: true,
                            like_count: true,
                        },
                        take: 20
                    }
                },
            })

            const communityIdTest = post.community.id
            const user = await prisma.users.findUnique({
                where: {
                    id: userInfo.userId
                },
                select: {
                    communities: {
                        select :{
                            id: true
                        }
                    }
                }
            })
            const match = user.communities.filter(c => c.id === communityIdTest)
            if (match) {
                post.community.isMember = true
            } else {
               throw new GraphQLError('Not authorised.')
            }

            return post
        },
        getComments: async (_, { post_id, community_id }, { userInfo, prisma }) => {

            const limit = 1
            const getComments = await prisma.comments.findMany({
                where: {
                    post_id
                },
                take: limit
            })

            return getComments
        },
        getCommentReactions: async (_, { comment_id }, { userInfo, prisma }) => {

            console.log('hit: ', comment_id)
            try {

                const likedBy = await prisma.comments.findMany({
                    where: {
                        id: comment_id
                    },
                    select: {
                        liked_by: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                                last_seen: true
                            }
                        }
                    }
                })

                return likedBy[0].liked_by

            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
        canViewCommunity: async (_, { project_id, community_id }, { userInfo, prisma }) => {

            if (!userInfo || !project_id) return false
            let user_wallet
            // TODO: Might be able to automated this by using the 'hro' or 'veve' abbr
            // and using like await prisma.[abbr]_wallets.findFirst({ ... })
            switch (true){
                // VEVE PROJECT
                case project_id === 'de2180a8-4e26-402a-aed1-a09a51e6e33d':
                    user_wallet = await prisma.veve_wallets.findFirst({
                        where: {
                            user_id: userInfo.userId
                        },
                        select: {
                            id: true
                        }
                    })
                    break
                // HRO PROJECT
                case project_id === 'e01fd52f-3e85-4036-b531-5f626f425862':
                    user_wallet = await prisma.hro_wallets.findFirst({
                        where: {
                            user_id: userInfo.userId
                        },
                        select: {
                            id: true
                        }
                    })
                    break
                default:
                    return false
            }

            if (!user_wallet) return false

            const gate_key = await prisma.communities.findUnique({
                where: {
                    id: community_id
                },
                select: {
                    gate_key: true,
                    veve_collectible_id: true,
                    veve_comic_id: true,
                }
            })

            switch (gate_key.gate_key) {
                case 'veve_collectible_id':
                    console.log('switch: gatekey is veve_collectible_id')
                    break
                default:
                    console.log('switch: defaulted.')
                    break
            }

            const tokens = await prisma.veve_tokens.findFirst({
                where: {
                    collectible_id: "a659bbc2-45cd-4f72-9ca2-7e92a245d05f",
                    wallet_id: user_wallet.id
                }
            })

            return !!tokens;
        },
    },
    Mutation: {
        createCommunity: async (_, { payload }, { userInfo, prisma }) => {

            return await prisma.communities.create({
                    data: {
                        ...payload,
                        members: {
                            connect: {
                                id: userInfo.userId
                            }
                        }
                    }
                })

        },
        joinCommunity: async (_, { community_id }, { userInfo, prisma }) => {

            console.log('user wants to join: ', community_id)

            const test = await prisma.communities.update({
                where: {
                    id: community_id
                },
                data: {
                    member_count: {increment: 1},
                    members: {
                        connect: {
                            id: userInfo.userId
                        }
                    }
                }
            })

            console.log('test is: ', test)

            return true
        },
        leaveCommunity: async (_, { community_id }, { userInfo, prisma }) => {

            console.log('user wants to leave: ', community_id)

            const test = await prisma.communities.update({
                where: {
                    id: community_id
                },
                data: {
                    member_count: {decrement: 1},
                    members: {
                        disconnect: {
                            id: userInfo.userId
                        }
                    }
                }
            })

            console.log('test is: ', test)

            return true
        },
        createPost: async (_, { payload }, { userInfo, prisma }) => {

            if (payload.community_id){
                try {
                    return await prisma.community_posts.create({
                        data: payload
                    })
                } catch (e) {
                    throw new GraphQLError('Failed to create post.')
                }
            } else {
                try {
                    return await prisma.posts.create({
                        data: payload
                    })
                } catch (e) {
                    throw new GraphQLError('Failed to create post.')
                }
            }

        },
        deletePost: async (_, { post_id }, { userInfo, prisma }) => {

            const deletePost = await prisma.posts.delete({
                where: {
                    id: post_id
                }
            })

            return !!deletePost;

        },
        likePost: async (_, { post_id }, { userInfo, prisma }) => {

            const likePost = await prisma.posts.update({
                where: {
                    id: post_id
                },
                data: {
                    like_count: {increment: 1},
                    liked_by: {
                        connect: {
                            id: userInfo.userId
                        }
                    }
                },
            })

            return !!likePost;

        },
        unlikePost: async (_, { post_id }, { userInfo, prisma }) => {

            const unlikePost = await prisma.posts.update({
                where: {
                    id: post_id
                },
                data: {
                    like_count: {decrement: 1},
                    liked_by: {
                        disconnect: {
                            id: userInfo.userId
                        }
                    }
                },
                include: {
                    liked_by: true
                }
            })

            return !!unlikePost;
        },
        createComment: async (_, { parent_id, post_id, community_id, body }, { userInfo, prisma }) => {

            const user = await prisma.users.findUnique({
                where: {
                    id: userInfo.userId,
                },
                select: {
                    communities: {
                        select :{
                            id: true
                        }
                    }
                }
            })
            const match = user.communities.filter(c => c.id === community_id)
            if (match) {
                if (parent_id) {
                    try {
                        await prisma.posts.update({
                            where: {
                                id: post_id,
                            },
                            data: {
                                comment_count: { increment: 1 }
                            }
                        })
                        return await prisma.comments.create({
                            data: {
                                post_id: post_id,
                                parent_id: parent_id,
                                community_id: community_id,
                                body: body,
                                author_id: userInfo.userId,
                                like_count: 0
                            },
                            select: {
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        })
                    } catch (e) {
                        console.log('nah: ', e)
                        throw new GraphQLError('Not authorised.')
                    }
                } else {
                    try {
                        await prisma.posts.update({
                            where: {
                                id: post_id,
                            },
                            data: {
                                comment_count: { increment: 1 }
                            }
                        })
                        return await prisma.comments.create({
                            data: {
                                author_id: userInfo.userId,
                                post_id: post_id,
                                community_id: community_id,
                                body: body,
                                like_count: 0
                            },
                            select: {
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        })
                    } catch (e) {
                        throw new GraphQLError('Not authorised.')
                    }
                }
            } else {
                throw new GraphQLError('Not authorised.')
            }

        },
        likeComment: async (_, { comment_id }, { userInfo, prisma }) => {

            try {
                await prisma.comments.update({
                    where: {
                        id: comment_id
                    },
                    data: {
                        like_count: { increment: 1 },
                        liked_by: {
                            connect: {
                                id: userInfo.userId
                            }
                        }
                    }
                })

                return true

            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
        unlikeComment: async (_, { comment_id }, { userInfo, prisma }) => {

            try {
                await prisma.comments.update({
                    where: {
                        id: comment_id
                    },
                    data: {
                        like_count: { decrement: 1 },
                        liked_by: {
                            disconnect: {
                                id: userInfo.userId
                            }
                        }
                    }
                })


                return true
            } catch (e) {
                throw new GraphQLError('Not authorised.')
            }

        },
    }
}

export default resolvers