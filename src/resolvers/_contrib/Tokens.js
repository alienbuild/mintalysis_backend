const Token = {
    collectible: async ({type, collectibleId}, __, { prisma }) => {
        if (type !== 'collectible') return null

        return await prisma.veve_collectibles.findUnique({
            where: {
                collectible_id: collectibleId
            }
        })
    },
    comic: async ({type, uniqueCoverId}, __, { prisma }) => {
        if (type !== 'comic') return null

        return await prisma.veve_comics.findUnique({
            where: {
                uniqueCoverId: uniqueCoverId
            }
        })
    }
}

export { Token }