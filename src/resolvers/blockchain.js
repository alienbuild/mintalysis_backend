const resolvers = {
    Query: {
        searchWalletsByTag: async (_, { tagName, visibility }, { prisma, userINfo }) => {
            const tag = await prisma.tag.findUnique({
                where: { name: tagName },
            });

            if (!tag) {
                return [];
            }

            let whereCondition = {
                veve_wallet_tags: {
                    some: {
                        tag_id: tag.id,
                        ...(visibility && { visibility: visibility }),
                    },
                },
            };

            // Optionally add logic to handle private tags for non-owners

            return await prisma.veve_wallets.findMany({
                where: whereCondition,
                include: {
                    veve_wallet_tags: true,
                },
            });
        },
    },
    Mutation: {
        addWalletTag: async (_, { wallet_id, tag_name, visibility }, { prisma, userInfo }) => {
            let tag = await prisma.tag.findUnique({ where: { name: tag_name } });
            if (!tag) {
                tag = await prisma.tag.create({ data: { name: tag_name } });
            }

            return await prisma.veve_wallet_tags.create({
                data: {
                    wallet_id,
                    tag_id: tag.id,
                    visibility,
                },
            });
        },
        updateWalletTagVisibility: async (_, { wallet_id, tag_id, visibility }, { prisma }) => {
            return await prisma.veve_wallet_tags.update({
                where: {
                    wallet_id_tag_id: {wallet_id, tag_id},
                },
                data: {visibility},
            });
        },
        removeWalletTag: async (_, { wallet_id, tag_id }, { prisma }) => {
            await prisma.veve_wallet_tags.delete({
                where: {
                    wallet_id_tag_id: { wallet_id, tag_id },
                },
            });

            return true;
        },
    },
}

export default resolvers