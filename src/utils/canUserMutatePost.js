export const canUserMutatePost = async ({ userId, postId, prisma }) => {
    const user = await prisma.User.findUnique({
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

    const post = await prisma.posts.findUnique({
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