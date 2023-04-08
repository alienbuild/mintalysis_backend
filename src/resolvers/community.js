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
        getPosts: async (_, { community_id }, { userInfo, prisma }) => {

            console.log('community id req is: ', community_id)

            const test = await prisma.posts.findMany({
                where: {
                    community_id: community_id
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
                        }
                    },
                    author: {
                        select: {
                            id: true,
                            username: true,
                            last_seen: true,
                            avatar: true
                        }
                    }
                }
            })

            console.log('test is: ', test)

            return test
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
    }
}

export default resolvers