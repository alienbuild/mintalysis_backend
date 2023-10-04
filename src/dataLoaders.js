import DataLoader from "dataloader";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const batchUsers = async (ids) => {
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: ids,
            },
        },
    });
    const userMap = {};
    users.forEach(user => {
        userMap[user.id] = user;
    });

    return ids.map(id => userMap[id]);
};

export const userLoader = () => {

    return new DataLoader((keys) => batchUsers(keys));
};
