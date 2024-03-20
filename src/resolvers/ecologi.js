import fetch from 'node-fetch'

const resolvers = {
    Query: {
        getEcologiStats: async (_, __, { prisma }) => {

            try {
                const fetchEcologiProfile = await fetch(`https://api.ecologi.com/users/mintalysis/profile`)
                const ecologiProfile = await fetchEcologiProfile.json()

                const totalTrees = ecologiProfile.data.totalTrees
                const totalCarbon = ecologiProfile.data.totalCarbonTonnes
                const totalHabitatMetersRestored = ecologiProfile.data.totalHabitatMetersRestored
                const totalCarbonRemovedTonnes = ecologiProfile.data.totalCarbonRemovedTonnes

                const userCount = await prisma.User.count()

                return {
                    trees: totalTrees,
                    carbon: totalCarbon,
                    habitat: totalHabitatMetersRestored,
                    carbon_removed: totalCarbonRemovedTonnes,
                    userCount: userCount
                }
            } catch (e) {
                console.log('Failed to get ecologi stats: ', e)
            }

        }
    }
}

export default resolvers