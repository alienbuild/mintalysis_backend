import {decodeCursor, encodeCursor} from "../utils/index.js";
import {GraphQLError} from "graphql";

const resolvers = {
    Query: {
        getImxVeveStats: async (_, { project_id }, { prisma }) => {

            return await prisma.imx_stats.findFirst({
                where: {
                    project_id: project_id
                }
            })

        },
        getImxVeveTransfers: async (_, { pagingOptions }, { prisma }) => {
            let limit = 10;
            if (pagingOptions && pagingOptions.limit) {
                limit = pagingOptions.limit;
            }

            const transfers = await prisma.veve_transfers.findMany({
                take: limit,
                orderBy: {
                    id: 'desc'
                },
                // If you only need specific fields, uncomment and adjust the following line
                // select: { id: true, from_wallet: true, to_wallet: true, /* other fields */ }
            });

            return {
                edges: transfers,
                pageInfo: {
                    endCursor: transfers.length > 0 ? encodeCursor(String(transfers[transfers.length - 1].id)) : null
                }
            }
        },
        getImxVeveMints: async (_, { pagingOptions }, { prisma }) => {
            let limit = 10;
            if (pagingOptions && pagingOptions.limit) {
                limit = pagingOptions.limit;
            }

            const mints = await prisma.veve_mints.findMany({
                take: limit,
                orderBy: {
                    id: 'desc'
                },
                // If you only need specific fields, uncomment and adjust the following line
                // select: { id: true, from_wallet: true, to_wallet: true, /* other fields */ }
            });

            return {
                edges: mints,
                pageInfo: {
                    endCursor: mints.length > 0 ? encodeCursor(String(mints[mints.length - 1].id)) : null
                }
            }
        },
        getCollectibleDetails: async (_, { tokenId }, { prisma }) => {
            try {
                const token = await prisma.veve_tokens.findUnique({
                    where: { token_id: parseInt(tokenId) },
                    include: {
                        veveTokenCollectibles: {
                            include: {
                                veve_collectibles: true,
                            }
                        },
                        veveTokenComics: {
                            include: {
                                veve_comics: true
                            }
                        }
                    }
                });

                if (!token) throw new Error("Token not found");

                return {
                    edition: token.edition,
                    type: token.type,
                    collectible: token.veveTokenCollectibles[0]?.veve_collectibles,
                    comic: token.veveTokenComics[0]?.veve_comics
                };
            } catch (e) {
                throw new GraphQLError('Unable to fetch transfer token details.')
            }

        },
        getWalletTransfers: async (_, {walletId, pagingOptions, sortOptions}, { prisma }) => {
            let limit = 5;
            let offset = 0;
            if (pagingOptions.limit) limit = pagingOptions.limit;
            if (pagingOptions.offset) offset = pagingOptions.offset;

            let whereParams = {};
            let sortParams = { timestamp_dt: 'asc' };

            if (sortOptions && sortOptions.sortBy) {
                sortParams = { [sortOptions.sortBy]: sortOptions.sortDirection === 'desc' ? 'desc' : 'asc' };
            }

            if (walletId) {
                whereParams = { ...whereParams, OR: [{ to_wallet: walletId }, { from_wallet: walletId }] };
            }

            const queryParams = {
                skip: offset,
                take: limit,
                where: whereParams,
                orderBy: sortParams,
                cacheStrategy: { swr: 60, ttl: 60 },
            };

            const transfers = await prisma.veve_transfers.findMany(queryParams);

            const totalCount = await prisma.veve_transfers.count({ where: whereParams });

            return {
                edges: transfers,
                totalCount: totalCount, // Used count() for totalCount
                pageInfo: {
                    endCursor: null, // endCursor doesn't make sense in offset pagination
                },
            };
        },
    },
    Subscription: {
        imxVeveStatsUpdated: {
            subscribe: (_, payload, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_STATS_UPDATED'])
            }
        },
        imxVeveTxnsUpdated: {
            subscribe: (_, payload, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_TRANSFERS_UPDATED'])
            }
        },
        imxVeveMintsUpdated: {
            subscribe: (_, payload, { pubsub }) => {
                return pubsub.asyncIterator(['IMX_VEVE_MINTS_UPDATED'])
            }
        }
    },
    VeveTransfer: {
        token: async ({ token_id }, __, { prisma, loaders }) => {
            const token = await prisma.veve_tokens.findUnique({
                where: {
                    token_id: token_id
                }
            });

            if (!token) return null;

            if (token.collectible_id) {
                token.collectible = await loaders.collectible.load(token.collectible_id);
            }

            if (token.unique_cover_id) {
                token.comic = await loaders.comic.load(token.unique_cover_id);
            }

            return token;
        },
        tags: async (args, __, { prisma }) => {

            const toWalletTag = await prisma.veve_wallets.findFirst({
                where: {
                    id: args.to_wallet,
                },
                select: {
                    tags: true
                }
            })

            const fromWalletTag = await prisma.veve_wallets.findFirst({
                where: {
                    id: args.from_wallet,
                },
                select: {
                    tags: true
                }
            })

            return [
                {
                    from_wallet: { tag: fromWalletTag.tags.name },
                    to_wallet: { tag: toWalletTag.tags.name },
                },
            ]
        }
    },
}

export default resolvers