export const batchBrands = async (brandIds, prisma) => {
    try {
        const brands = await prisma.veve_brands.findMany({
            where: {
                brand_id: { in: brandIds },
            },
        });

        const brandMap = {};
        brands.forEach(brand => {
            brandMap[brand.brand_id] = brand;
        });

        return brandIds.map(id => brandMap[id] || null);
    } catch (error) {
        console.error("Error in batchBrands:", error);
        throw error;
    }
}
