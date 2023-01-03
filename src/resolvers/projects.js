const resolvers = {
    Query: {
        projects: async (_,{ id, name }, { prisma }) => {
            let queryParams = {}
            if (id) queryParams = { ...queryParams, id}
            if (name) queryParams = { ...queryParams, name}
            if (id){
                return [prisma.nft_projects.findUnique({
                    where:queryParams
                })]
            } else {
                return prisma.nft_projects.findMany({})
            }
        }
    },
    Mutation: {
        createProject: async (_, { name, abbr, active }, { prisma, userInfo }) => {
            return prisma.nft_projects.create({
                data: {
                    name,
                    abbr,
                    active
                }
            })
        }
    },
}

export default resolvers