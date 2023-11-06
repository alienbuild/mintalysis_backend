export const batchComics = async (uniqueCoverIds, prisma, lang = 'EN') => {
    try {
        const comics = await prisma.veve_comics.findMany({
            where: {
                unique_cover_id: { in: uniqueCoverIds },
            },
            include: {
                translations: {
                    where: {
                        language: lang
                    }
                }
            }
        });

        const comicMap = new Map(comics.map(comic => [comic.unique_cover_id, comic]));
        return uniqueCoverIds.map(id => comicMap.get(id) || null);
    } catch (error) {
        console.error("Error in batchComics:", error);
        throw error;
    }
};
