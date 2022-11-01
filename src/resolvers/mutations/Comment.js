export const commentResolvers = {
    createComment(parent, args, { prisma, userInfo }) {

        // if (!userInfo){
        //     return {
        //         userErrors: [{ message: "Forbidden access (unauthenticated)" }],
        //         post: null
        //     }
        // }
        //
        // const postExists = prisma.post.find({
        //     where: {
        //         id: args.data.post,
        //         published: true
        //     }
        // })
        //
        // if (!userInfo || !postExists) {
        //     throw new Error('Unable to find user and post')
        // }


        // prisma.comments.push(args.data)

        return {
            userErrors: [],
        }
    },
    deleteComment(parent, args, { prisma }, info) {
        // const commentIndex = prisma.comments.findIndex((comment) => comment.id === args.id)
        //
        // if (commentIndex === -1) {
        //     throw new Error('Comment not found')
        // }
        //
        // const deletedComments = prisma.comments.splice(commentIndex, 1)

        // return deletedComments[0]
        return {
            userErrors: []
        }
    },
    updateComment(parent, args, { prisma }, info) {
        // const { id, data } = args
        // const comment = prisma.comments.find((comment) => comment.id === id)
        //
        // if (!comment) {
        //     throw new Error('Comment not found')
        // }
        //
        // if (typeof data.text === 'string') {
        //     comment.text = data.text
        // }
        //
        // return comment
        return {
            userErrors: []
        }
    }
}