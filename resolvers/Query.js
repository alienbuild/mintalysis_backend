exports.Query = {
    collectibles: (parent, {filter}, {collectibles}) => {
        let filteredCollectibles = collectibles

        if (filter){
            if (filter.soldOut === true){
                filteredCollectibles = filteredCollectibles.filter(collectible => collectible.soldOut)
            }
        }

        return filteredCollectibles
    },
    collectible: (parent, {id}, {collectibles}) => {
        return collectibles.find(collectible => collectible.id === id)
    },
    brands: (parent, args, {brands}) => brands,
    brand: (parent, {id}, {brands}) => {
        return brands.find(brand => brand.id === id)
    }
}