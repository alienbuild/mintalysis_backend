exports.Brand = {
    collectibles: ({id}, { filter }, { collectibles }) => {
        let filteredBrandCollectibles = collectibles.filter(collectible => collectible.id === id)

        if (filter){
            if (filter.soldOut === true){
                filteredBrandCollectibles = filteredBrandCollectibles.filter(collectible => collectible.soldOut)
            }
        }

        return filteredBrandCollectibles
    }
}