import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient()

const dfnVeveEditionType = (edition) => {
    switch (edition){
        case 'FA':
            return 'First appearance'
        case 'FE':
            return 'First edition'
        case 'CE':
            return 'Con exclusive'
        default:
            return
    }
}

const translateCollectiblesToEnglish = async () => {

    const collectibles = await prisma.veve_collectibles.findMany({
        skip: 1
    })

    collectibles.map(async (collectible, index) => {

        // if (index > 0) return

        console.log('[MIGRATING]: ', collectible.collectible_id )
        try {

            const save = await prisma.veve_collectibles.update({
                where:{
                    collectible_id: collectible.collectible_id
                },
                data: {
                    translations: {
                        create: {
                            name: collectible.name,
                            description: collectible.description,
                            rarity: collectible.rarity.replace("_", " "),
                            edition_type: dfnVeveEditionType(collectible.edition_type),
                            language: "EN"
                        }
                    }
                }
            })

            console.log('[SAVED] ', collectible.collectible_id)

        } catch (e) { 
            console.log('FAILED', collectible.collectible_id)
        }
    })

}


translateCollectiblesToEnglish()