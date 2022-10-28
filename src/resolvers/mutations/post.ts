import {posts, Prisma} from ".prisma/client"
import {Context} from "../../index"
import {canUserMutatePost} from "../../utils/canUserMutatePost"

interface PostArgs {
    post: {
        title?: string
        content?: string
    }
}

interface PostPayloadType {
    userErrors: {
        message: String
    }[],
    post: posts | Prisma.Prisma__postsClient<posts> | null
}

export const postResolvers = {
    postCreate: async (_: any, { post }: PostArgs, { prisma, userInfo }: Context ): Promise<PostPayloadType> => {

        if (!userInfo){
            return {
                userErrors: [{ message: "Forbidden access (unauthenticated)" }],
                post: null
            }
        }

        const { title, content } = post
        if (!title || !content) {
            return {
                userErrors: [{ message: "You must provide a title and a content body to create a post." }],
                post: null
            }
        }

        return {
            userErrors: [],
            post: prisma.posts.create({
                data: {
                    title,
                    content,
                    author_id: userInfo.userId
                }
            })
        }

    },
    postUpdate: async (_:any, { post, postId }: {postId: string, post: PostArgs["post"]}, { prisma }: Context): Promise<PostPayloadType> => {
        const { title, content } = post

        if (!title && !content) {
            return {
                userErrors: [{ message: "Please provide a field to update." }],
                post: null
            }
        }

        const exisitingPost = await prisma.posts.findUnique({
            where: {
                id: Number(postId)
            }
        })

        if (!exisitingPost) {
            return {
                userErrors: [{ message: "Post with this ID does not exist." }],
                post: null
            }
        }

        let payloadToUpdate = {
            title,
            content
        }

        if (!title) delete payloadToUpdate.title
        if (!content) delete payloadToUpdate.content

        return {
            userErrors: [{ message: "Please provide a field to update." }],
            post: prisma.posts.update({
                data: {
                    ...payloadToUpdate
                },
                where: {
                    id: Number(postId)
                }
            })
        }

    },
    postDelete: async (_:any, { postId }: { postId: String }, { prisma, userInfo }: Context ): Promise<PostPayloadType> => {

        if (!userInfo){
            return {
                userErrors: [{ message: "Forbidden access (unauthenticated)" }],
                post: null
            }
        }

        const error = await canUserMutatePost({userId: userInfo.userId, postId: Number(postId), prisma})

        if (error) return error

        const post = await prisma.posts.findUnique({
            where: {
                id: Number(postId)
            }
        })

        if (!post) {
            return {
                userErrors: [{ message: "Post with this ID does not exist." }],
                post: null
            }
        }

        await prisma.posts.delete({
            where: {
                id: Number(postId)
            }
        })

        return {
            userErrors: [],
            post: post
        }
    },
    postPublish: async (_:any, { postId } : { postId: String }, { prisma, userInfo }: Context ) => {

        if (!userInfo){
            return {
                userErrors: [{ message: "Forbidden access (unauthenticated)" }],
                post: null
            }
        }

        const error = await canUserMutatePost({userId: userInfo.userId, postId: Number(postId), prisma})

        if (error) return error

        return {
            userErrors: [],
            post: prisma.posts.update({
                where: {
                    id: Number(postId)
                },
                data: {
                    published: true
                }
            })
        }

    },
    postUnpublish: async (_:any, { postId } : { postId: String }, { prisma, userInfo }: Context ) => {

        if (!userInfo){
            return {
                userErrors: [{ message: "Forbidden access (unauthenticated)" }],
                post: null
            }
        }

        const error = await canUserMutatePost({userId: userInfo.userId, postId: Number(postId), prisma})

        if (error) return error

        return {
            userErrors: [],
            post: prisma.posts.update({
                where: {
                    id: Number(postId)
                },
                data: {
                    published: false
                }
            })
        }

    }
}