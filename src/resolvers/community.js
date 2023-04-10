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
                    creator_id: true,
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
        getPosts: async (_, { community_id, project_id }, { userInfo, prisma }) => {

            let whereParams = {}

            if (community_id) whereParams = { ...whereParams, community_id }
            if (project_id) whereParams = { ...whereParams, project_id }

            const getPosts = await prisma.posts.findMany({
                where: whereParams,
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
                            liked_by: {
                                where: {
                                    id: userInfo.userId
                                },
                                select: {
                                    id: true
                                }
                            },
                        },
                        take: 1
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            })

            return getPosts

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

            console.log('comments are: ', getComments)

            return getComments
        }
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

            return await prisma.posts.create({
                data: payload
            })

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
        createComment: async (_, { post_id, community_id, body }, { userInfo, prisma }) => {

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
                await prisma.post.update({
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