const VeveTransfer = {
    token: async ({ token_id }, __, { prisma }) => {
        return await prisma.tokens.findUnique({
            where: {
                token_id: token_id
            }
        })
    }
}

export { VeveTransfer }