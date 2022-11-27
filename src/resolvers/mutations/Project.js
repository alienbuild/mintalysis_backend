export const projectResolvers = {
    createProject: async (_, { name, abbr, active }, { prisma, userInfo }) => {
        return prisma.nft_projects.create({
            data: {
                name,
                abbr,
                active
            }
        })
    }
}