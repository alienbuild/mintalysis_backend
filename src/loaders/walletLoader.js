import DataLoader from "dataloader";

export const batchWalletsByUserId = async ({ userIds, prisma }) => {
    try {
        const wallets = await prisma.veve_wallets.findMany({
            where: {
                user_id: { in: userIds },
            },
        });
        const walletMap = {};
        wallets.forEach(wallet => {
            walletMap[wallet.user_id] = wallet;
        });
        return userIds.map(userId => walletMap[userId] || null);
    } catch (error) {
        console.error("Error in batchWalletsByUserId:", error);
        throw error;
    }
};
