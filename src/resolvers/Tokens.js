const Token = {
    collectible: async ({type, collectibleId, uniqueCoverId}, __, { prisma }) => {
        if (type !== 'collectible') return null

        return await prisma.collectibles.findUnique({
            where: {
                collectible_id: collectibleId
            }
        })
    }
}

export { Token }