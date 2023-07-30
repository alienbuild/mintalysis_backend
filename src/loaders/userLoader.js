import DataLoader from "dataloader"
import prisma from 'prisma'

const batchUsers = async (ids) => {
    const users = await prisma.User.findMany({
        where: {
            id: {
                in: ids
            }
        }
    })

    const userMap = {}

    users.forEach(user => {
        userMap[user.id] = user
    })

    return ids.map((id) => userMap[id])

}

export const userLoader = new DataLoader(batchUsers)