import Dataloader from 'dataloader'
import { users } from ".prisma/client"
import { prisma } from '..'


type BatchUser = (ids: number[]) => Promise<users[]>

const batchUsers: BatchUser = async (ids) => {
    const users = await prisma.users.findMany({
        where: {
            id: {
                in: ids
            }
        }
    })

    const userMap: { [key: string]: users } = {}

    users.forEach(user => {
        userMap[user.id] = user
    })

    return ids.map((id) => userMap[id])

}

// @ts-ignore
export const userLoader = new Dataloader<number, users>(batchUsers)