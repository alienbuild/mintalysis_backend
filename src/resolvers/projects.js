import {slugify} from "../utils/index.js";
import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        projects: async (_,{ id, name, active }, { prisma, userInfo }) => {

            try {
                let whereParams = {}
                if (id) whereParams = { ...whereParams, id}
                if (name) whereParams = { ...whereParams, name}
                if (active) whereParams = { ...whereParams, active: true }
                if (id){ return [prisma.projects.findUnique({ where: whereParams })]
                } else {
                    return prisma.projects.findMany({ where: whereParams, orderBy: { sort: 'asc' } })
                }
            } catch (error) {
                console.log('Error: ', error)
                throw new GraphQLError('Unable to find projects.')
            }

        }
    },
    Mutation: {
        createProject: async (_, { name, abbr, active }, { prisma, userInfo }) => {

            try {
                return  await prisma.projects.create({
                    data: {
                        name,
                        abbr,
                        active,
                        slug: slugify(name)
                    }
                })

            } catch (e) {
                console.log('Nah ', e)
                throw new GraphQLError('Unable to create project.')
            }

        }
    },
}

export default resolvers