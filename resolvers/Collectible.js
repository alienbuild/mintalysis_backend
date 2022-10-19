exports.Collectible = {
    brand: ({brandId}, args, { brands }) => {
        return brands.find(brand => brand.id === brandId)
    }
}