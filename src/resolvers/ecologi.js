const resolvers = {
    Query: {
        getEcologiStats: async (_, __, { prisma }) => {
            const fetchTrees =  await fetch(`https://public.ecologi.com/users/mintalysis/trees`)
            const trees = await fetchTrees.json()

            const fetchCarbon = await fetch(`https://public.ecologi.com/users/mintalysis/carbon-offset`)
            const carbon = await fetchCarbon.json()

            const userCount = await prisma.users.count()

            return {
                trees: trees.total,
                carbon: carbon.total,
                userCount: userCount
            }
        }
    }
}

export default resolvers