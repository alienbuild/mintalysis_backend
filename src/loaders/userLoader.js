export const batchUsers = async (ids, prisma) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: ids },
            },
        });

        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user;
        });

        return ids.map(id => userMap[id] || null);
    } catch (error) {
        console.error("Error in batchUsers:", error);
        throw error;
    }
};