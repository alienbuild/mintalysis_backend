const resolvers = {
    Query: {
        projects: async (_,{ id, name, active }, { prisma }) => {

            let whereParams = {}
            if (id) whereParams = { ...whereParams, id}
            if (name) whereParams = { ...whereParams, name}
            if (active) whereParams = { ...whereParams, active: true }
            if (id){ return [prisma.projects.findUnique({ where: whereParams })]
            } else {
                return prisma.projects.findMany({ where: whereParams })
            }
        }
    },
    Mutation: {
        createProject: async (_, { name, abbr, active }, { prisma, userInfo }) => {
            return prisma.projects.create({
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