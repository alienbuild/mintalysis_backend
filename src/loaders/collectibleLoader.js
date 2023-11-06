export const batchCollectibles = async (collectibleIds, prisma, lang = 'EN') => {
    try {
        const collectibles = await prisma.veve_collectibles.findMany({
            where: {
                collectible_id: { in: collectibleIds },
            },
            include: {
                translations: {
                    where: {
                        language: lang
                    }
                }
            }
        });

        const collectibleMap = new Map(collectibles.map(collectible => [collectible.collectible_id, collectible]));
        return collectibleIds.map(id => collectibleMap.get(id) || null);
    } catch (error) {
        console.error("Error in batchCollectibles:", error);
        throw error;
    }
}
