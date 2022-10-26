import {post, Prisma} from ".prisma/client"
import {Context} from "../../index"

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
    post: post | Prisma.Prisma__postClient<post> | null
}

export const postResolvers = {
    postCreate: async (_: any, { post }: PostArgs, { prisma }: Context ): Promise<PostPayloadType> => {

        const { title, content } = post
        if (!title || !content) {
            return {
                userErrors: [{ message: "You must provide a title and a content body to create a post." }],
                post: null
            }
        }

        return {
            userErrors: [],
            post: prisma.post.create({
                data: {
                    title,
                    content,
                    author_id: 1
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

        const exisitingPost = await prisma.post.findUnique({
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
            post: prisma.post.update({
                data: {
                    ...payloadToUpdate
                },
                where: {
                    id: Number(postId)
                }
            })
        }

    },
    postDelete: async (_:any, { postId }: { postId: String }, { prisma }: Context ): Promise<PostPayloadType> => {
        const post = await prisma.post.findUnique({
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

        await prisma.post.delete({
            where: {
                id: Number(postId)
            }
        })

        return {
            userErrors: [],
            post: post
        }
    }
}