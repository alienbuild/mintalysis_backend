import DataLoader from 'dataloader';

export const batchTransfers = async (compoundKeys, prisma) => {
    const tokenIds = compoundKeys.map(key => key.tokenId);
    const walletIds = compoundKeys.map(key => key.walletId);

    const transfers = await prisma.veve_transfers.findMany({
        where: {
            token_id: { in: tokenIds },
            to_wallet: { in: walletIds }
        },
    });

    const transferMap = new Map(transfers.map(transfer => {
        const key = `${transfer.token_id}_${transfer.to_wallet}`;
        return [key, transfer];
    }));

    return compoundKeys.map(({ tokenId, walletId }) => {
        const key = `${tokenId}_${walletId}`;
        return transferMap.get(key) || null;
    });
};

export const transferLoader = new DataLoader(keys => batchTransfers(keys), {
    cacheKeyFn: key => `${key.tokenId}_${key.walletId}`
});