import {Context} from "../index";

interface canUserMutatePostParams {
    userId: number,
    postId: number,
    prisma: Context["prisma"]
}

export const canUserMutatePost = async ({ userId, postId, prisma }: canUserMutatePostParams) => {
    const user = await prisma.users.findUnique({
        where: {
            id: userId
        }
    })

    if (!user){
        return {
            userErrors: [{ message: "User not found." }],
            post: null
        }
    }

    const post = await prisma.post.findUnique({
        where: {
            id: postId
        }
    })

    if (post?.author_id !== user.id){
        return {
            userErrors: [{ message: "Forbidden access. Post not owned by user." }],
            post: null
        }
    }

}