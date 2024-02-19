import {validateVeveUsername} from "../utils/validateVeveUsername.js"
import CollectiblePrice from "../../models/CollectiblePrices.js"
import ComicPrice from "../../models/ComicPrices.js"
import {GraphQLError} from "graphql"
import fetch from "node-fetch"
import {setTimeout} from "node:timers/promises"
import {decodeCursor, encodeCursor, truncate} from "../utils/index.js"
import {VEVE_VERIFY_USER} from "../../services/projects/veve/VEVE_VERIFY_USER.js";

let tokenItems = []
let fullCapture = false
let i = 0
let pageSize = 200

const fetchInitialData = async (tokenCount, wallet_address) => {
    console.log(`url is: https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}&status=imx`)
    const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}`)
    const walletItems = await getWalletItems.json()

    await walletItems.result.map(async item => {
        await setTimeout(150)
        i++
        await tokenItems.push(Number(item.token_id))
    })

    if (!walletItems.cursor) fullCapture = true
    if (!fullCapture) {
        await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
    }
}
const keepFetchingData = async (cursor, tokenCount, wallet_address) => {
    try {
        await setTimeout(2500)
        // if (tokenCount <= 200) pageSize = tokenCount
        const getWalletItems = await fetch(`https://api.x.immutable.com/v1/assets?page_size=${pageSize}&user=${wallet_address}`)
        const walletItems = await getWalletItems.json()

        await walletItems.result.map(async item => {
            await setTimeout(150)
            await tokenItems.push(Number(item.token_id))
        })

        if (!cursor) fullCapture = true
        if (!fullCapture) {
            console.log('still not a full capture, getting more....')
            await keepFetchingData(walletItems.cursor, tokenCount, wallet_address)
        }

    } catch (e) {
        console.log('[ERROR]: Something went wrong fetching more data.')
    }
}

const resolvers = {
    Query: {
        validateVeveUsername: async (_, {username}, ___) => {
            let returnArr = []
            try {
                const userList = await validateVeveUsername(username)
                userList.edges.map((user) => {
                    returnArr.push(user.node.username)
                })
            } catch (err) {
                console.log('[ERROR] Fetching user list from VEVE api: ', err)
            }

            return returnArr
        },
        veveCollectiblePriceData: async (_, { collectibleId, type, period }, { userInfo, prisma }) => {
            console.log('get price cid: ', collectibleId)
            console.log('get price type: ', type)
            const aggregatePriceData = async (model, idField, idValue) => {
                try {
                    return await model.aggregate([
                        {
                            "$match": {
                                [idField]: idValue,
                            }
                        },
                        {
                            "$group": {
                                _id: {
                                    symbol: `$${idField}`,
                                    date: {
                                        $dateTrunc: {
                                            date: "$date",
                                            unit: "day",
                                            binSize: 1
                                        },
                                    },
                                },
                                value: { $avg: "$value" },
                                high: { $max: "$value" },
                                low: { $min: "$value" },
                                open: { $first: "$value" },
                                close: { $last: "$value" },
                                volume: { $avg: "$volume" },
                            }
                        },
                        {
                            "$set": {
                                date: "$_id.date",
                            }
                        },
                        {
                            $sort: { "date": 1 }
                        }
                    ]);
                } catch (err) {
                    throw new GraphQLError('Unable to get collectible data.');
                }
            };

            switch (type) {
                case 'collectible':
                    return await aggregatePriceData(CollectiblePrice, 'collectibleId', collectibleId);
                case 'comic':
                    return await aggregatePriceData(ComicPrice, 'uniqueCoverId', collectibleId);
                default:
                    return await aggregatePriceData(CollectiblePrice, 'collectibleId', collectibleId);
            }
        },
        veveCollectibles: async (_, { collectibleId, search, pagingOptions, sortOptions, filterOptions, lang = "EN" }, { prisma }) => {

            const DEFAULT_LIMIT = 25;
            const MAX_LIMIT = 100;

            const { limit = DEFAULT_LIMIT, after } = pagingOptions || {};
            if (limit > MAX_LIMIT) return null;

            const where = { drop_date: { lte: new Date() } };
            const include = { metrics: true, translations: { where: { language: lang } } };
            const orderBy = [{ drop_date: 'desc' }];

            try {
                if (collectibleId) {
                    const collectibles = await prisma.veve_collectibles.findUnique({
                        where: { collectible_id: collectibleId },
                        include
                    });
                    return { edges: [collectibles] };
                }

                if (sortOptions?.sortBy) {
                    const { sortBy, sortDirection = 'desc' } = sortOptions;
                    orderBy.length = 0;
                    switch (sortBy) {
                        case 'coming_soon':
                            where.drop_date = { gte: new Date() };
                            break;
                        case 'hottest':
                            orderBy.push({ metrics: { one_day_change: 'desc' } });
                            break;
                        case 'coldest':
                            orderBy.push({ metrics: { one_day_change: 'asc'} });
                            where.floor_price = { gt: 0 };
                            break;
                        case 'one_day_change':
                            orderBy.push({ metrics: { one_day_change: sortDirection } })
                            break;
                        case 'one_wk_change':
                            orderBy.push({ metrics: { one_wk_change: sortDirection } })
                            break;
                        case 'one_mo_change':
                            orderBy.push({ metrics: { one_mo_change: sortDirection } })
                            break;
                        case 'three_mo_change':
                            orderBy.push({ metrics: { three_mo_change: sortDirection } })
                            break;
                        case 'six_mo_change':
                            orderBy.push({ metrics: { six_mo_change: sortDirection } })
                            break;
                        case 'one_year_change':
                            orderBy.push({ metrics: { one_year_change: sortDirection } })
                            break;
                        case 'all_time_change':
                            orderBy.push({ metrics: { all_time_change: sortDirection } })
                            break;
                        case 'drop_date':
                            orderBy.push({ drop_date: 'desc' });
                            break;
                        default:
                            orderBy.push({ [sortBy]: sortDirection });
                    }
                }

                if (after) where.collectible_id = { gt: decodeCursor(after) }
                if (filterOptions?.underRRP) where.floor_price = { lt: await prisma.veve_collectibles.fields.store_price }

                if (search) where.name = { contains: search }

                const collectibles = await prisma.veve_collectibles.findMany({
                    take: limit,
                    skip: after ? 1 : 0,
                    where,
                    orderBy,
                    include
                });

                // const valuations = await prisma.veve_wallets_valuations.findMany({
                //     where: {
                //         wallet_id: "123123swer"
                //     },
                //     include: {
                //         wallet: true
                //     }
                // })

                return {
                    edges: collectibles,
                    pageInfo: {
                        endCursor: collectibles.length > 1 ? encodeCursor(collectibles.slice(-1)[0].collectible_id) : null,
                    }
                };
            } catch (error) {
                console.log('Error: ', error)
                throw new GraphQLError(`Unable to find veve collectibles`)
            }
        },
        veveComics: async (_, { uniqueCoverId, search, pagingOptions, after }, { prisma }) => {

            const DEFAULT_LIMIT = 25;
            const MAX_LIMIT = 100;

            const { limit = DEFAULT_LIMIT } = pagingOptions || {};

            if (limit > MAX_LIMIT) return null;

            const where = {};
            const queryParams = {
                take: limit,
                orderBy: [{ createdAt: 'desc' }],
            };

            if (uniqueCoverId) where.unique_cover_id = uniqueCoverId;

            if (after) {
                queryParams.skip = 1;
                queryParams.cursor = { unique_cover_id: decodeCursor(after) };
            }

            if (search) where.name = { contains: search };

            queryParams.where = where;

            const comics = await prisma.veve_comics.findMany(queryParams);

            return {
                edges: comics,
                pageInfo: {
                    endCursor: comics.length > 1 ? encodeCursor(comics.slice(-1)[0].unique_cover_id) : null,
                },
            };

        },
        veveBrands: async (_, { pagingOptions, sortOptions, search }, { prisma }) => {

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 100) return null

            let queryParams = { take: limit }
            let whereParams = {}

            if (pagingOptions && pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { brand_id: decodeCursor(pagingOptions.after) } }
            if (search) whereParams = { ...whereParams, name: { contains: search } }

            queryParams = { ...queryParams, where: { ...whereParams } }

            const brands = await prisma.brands.findMany(queryParams)

            return {
                edges: brands,
                pageInfo: {
                    endCursor: brands.length > 1 ? encodeCursor(brands[brands.length - 1].brand_id) : null,
                },
                totalCount: brands.length
            }
        },
        veveLicensors: async (_, { pagingOptions, sortOptions, search }, { prisma }) => {

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 100) return null

            let queryParams = { take: limit }
            let whereParams = {}

            if (pagingOptions && pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { licensor_id: decodeCursor(pagingOptions.after) } }
            if (search) whereParams = { ...whereParams, name: { contains: search } }

            queryParams = { ...queryParams, where: { ...whereParams } }

            const licensors = await prisma.licensors.findMany(queryParams)

            return {
                edges: licensors,
                pageInfo: {
                    endCursor: licensors.length > 1 ? encodeCursor(licensors[licensors.length - 1].licensor_id) : null,
                },
                totalCount: licensors.length
            }
        },
        veveSeries: async (_, { brandId, pagingOptions, sortOptions, search, lang = "EN" }, { prisma }) => {

            let selectParams = { translations: { where: { language: lang } } }

            const series = await prisma.veve_collectibles.findMany({
                where: {
                    brand_id: brandId
                },
                include: selectParams
            })

            return {
                edges: series,
                totalCount: series.length,
            }
        },
        veveDropDates: async (_, { startDate, endDate }, { prisma }) => {

            return await prisma.veve_collectibles.findMany({
                where: {
                    drop_date: {
                        gte: new Date(startDate).toISOString(),
                        lte: new Date(endDate).toISOString(),
                    },
                },
                // distinct: ['drop_date'],
                select: {
                    collectible_id: true,
                    name: true,
                    rarity: true,
                    store_price: true,
                    image_thumbnail_url: true,
                    total_issued: true,
                    drop_date: true
                }
            })

        },
        veveValuations: async (_, __, { prisma, userInfo }) => {

            const user_wallet = await prisma.veve_wallets.findFirst({
                where: {
                    user_id: userInfo.sub
                },
                select: {
                    id: true
                }
            })

            const groupedCollectibles = await prisma.veve_tokens.groupBy({
                by: ['collectible_id'],
                where: {
                    wallet_id: user_wallet.id
                },
                _count: {
                    collectible_id: true,
                },
            })

            const collectibleIds = groupedCollectibles.map(collectible => collectible.collectible_id)
            collectibleIds.shift()

            const collectibleValues = await prisma.veve_collectibles.findMany({
                where: {
                    collectible_id: { in: collectibleIds }
                },
                select: {
                    collectible_id: true,
                    floor_price: true,
                    market_fee: true
                }
            })

            let collectiblesValuation = 0

            await collectibleValues.map((collectible) => {
                const match = groupedCollectibles.filter(obj => obj.collectible_id === collectible.collectible_id)
                if (match && match.length > 0){
                    collectiblesValuation += collectible.floor_price * match[0]._count.collectible_id
                }
            })

            let comicsValuation = 0

            return {
                "comics": comicsValuation,
                "collectibles": collectiblesValuation,
                "total": collectiblesValuation + comicsValuation
            }

        },
        getUserMagicSet: async (_, { seriesId }, { prisma, userInfo }) => {

            const setTotal = await prisma.veve_collectibles.count({
                where: {
                    series_id: seriesId
                },
            })

            const groupBy = await prisma.veve_tokens.groupBy({
                by: ['edition'],
                where: {
                    user_id: userInfo.sub,
                    series_id: seriesId
                },
                _count: {
                    edition: true,
                },
                orderBy: {
                    _count: {
                        edition: 'desc',
                    },
                },
            })

            let magicSets = []
            await Promise.all(
                groupBy.map(async (groupedToken, index) => {
                    if (groupedToken._count.edition > 1) {
                        const edition = groupedToken.edition

                        const set = await prisma.veve_tokens.findMany({
                            where: {
                                edition: edition,
                                series_id: seriesId,
                                user_id: userInfo.sub,
                            },
                            select: {
                                name: true,
                                edition: true,
                                rarity: true,
                                series: {
                                    select: {
                                        name: true,
                                        season: true
                                    }
                                },
                            },
                        })
                        magicSets.push({ set, edition, count: set.length, series_name: set[0].series.name, season: set[0].series.season, setTotal })
                    }
                })
            )

            magicSets.sort((a,b) => b.count - a.count)

            return magicSets

        },
        getUsersVeveTokens: async (_, { token_id, grouped, type, search, pagingOptions, editionNumber, collectible_id, unique_cover_id }, { userInfo, prisma }) => {
            if (!userInfo) throw new GraphQLError('Not authorized');

            try {
                const limit = pagingOptions?.limit || 25;

                const user_wallet = await prisma.veve_wallets.findFirst({
                    where: {
                        user_id: userInfo.sub
                    },
                    select: {
                        id: true
                    }
                });

                const whereParams = {
                    wallet_id: user_wallet.id
                };

                if (search) {
                    whereParams.name = { contains: search };
                }
                if (editionNumber) {
                    whereParams.edition = editionNumber;
                }
                if (collectible_id) {
                    whereParams.collectible_id = collectible_id;
                }
                if (unique_cover_id) {
                    whereParams.unique_cover_id = unique_cover_id;
                }

                let queryParams = {
                    take: limit,
                    where: whereParams
                };

                if (pagingOptions?.after) {
                    queryParams.cursor = { token_id: Number(decodeCursor(pagingOptions.after)) };
                }

                if (grouped) {
                    queryParams.distinct = ['collectible_id', 'unique_cover_id'];
                }

                let tokens;

                if (token_id) {
                    tokens = [await prisma.veve_tokens.findUnique({ where: { token_id: Number(token_id) } })];
                } else {
                    try {
                        tokens = await prisma.veve_tokens.findMany(queryParams);
                    } catch (e) {
                        console.log('FML : ', e)
                    }
                }

                const pageInfo = {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                };

                return {
                    edges: tokens,
                    pageInfo
                };
            } catch (e) {
                console.error('Unable to get veve tokens:', e);
                throw new Error('Unable to fetch veve tokens');
            }
        },
        getUserTokens: async (_, __, { userInfo, prisma }) => {
            console.log('Fetching user tokens...')
            try {
                const userCollectibles = await prisma.veve_wallets.findUnique({
                    where: { user_id: userInfo.sub },
                    select: {
                        veve_tokens: {
                            take: 50,
                            select: {
                                veve_collectibles: {
                                    select: {
                                        collectible_id: true,
                                        name: true
                                    }
                                }
                            },
                        }
                    }
                });
                console.log('userCollectibles is:', userCollectibles)
            } catch (e) {
                console.log('error: ', e)
                return true
            }
        },
        getCollectibleWatchlist: async (_,{ after, search, pagingOptions }, { userInfo, prisma }) => {

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 100) return null

            let queryParams = { take: limit, select: { collectible: true } }
            let whereParams = { user_id: userInfo.sub, NOT: [{ collectible_id: null }] }
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { collectible_id: decodeCursor(after) } }
            if (search) whereParams = {...whereParams, name: { contains: search } }

            queryParams = { ...queryParams, where: { ...whereParams } }

            let collectiblesArr = []
            const collectibles = await prisma.veve_watchlist.findMany(queryParams)

            await collectibles.map(collectible => {
                collectiblesArr.push(collectible.collectible)
            })

            return {
                edges: collectiblesArr,
                pageInfo: {
                    endCursor: collectiblesArr.length > 1 ? encodeCursor(collectiblesArr[collectiblesArr.length - 1].collectible_id) : null,
                }
            }

        },
        getComicWatchlist: async (_,{ after, search, pagingOptions }, { userInfo, prisma }) => {

            let limit = 25
            if (pagingOptions?.limit) limit = pagingOptions.limit

            if (limit > 100) return null

            let queryParams = { take: limit, select: { comic: true } }
            let whereParams = { user_id: userInfo.sub, NOT: [{ unique_cover_id: null }] }
            if (after) queryParams = { ...queryParams, skip: 1, cursor: { unique_cover_id: decodeCursor(after) } }
            if (search) whereParams = {...whereParams, name: { contains: search } }

            queryParams = { ...queryParams, where: { ...whereParams } }

            let comicsArr = []
            const comics = await prisma.veve_watchlist.findMany(queryParams)

            await comics.map(comic => {
                comicsArr.push(comic.comic)
            })

            return {
                edges: comicsArr,
                pageInfo: {
                    endCursor: comicsArr.length > 1 ? encodeCursor(comicsArr[comicsArr.length - 1].unique_cover_id) : null,
                }
            }
        },
        tokens: async (_, { token_id, type, search, limit = 15, after, grouped, userId, editionNumber, collectible_id, unique_cover_id, kraken }, { prisma, userInfo }) => {
            if (kraken) limit = 10000
            let queryParams = { take: limit }
            let whereParams = {}

            if (after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(after)) } }

            if (search) whereParams = { ...whereParams, name: { contains: search } }
            if (type) whereParams = { ...whereParams, type: type }
            if (userId) {
                const user_wallet = await prisma.veve_wallets.findUnique({
                    where: {
                        user_id: userId
                    }
                })
                whereParams = { ...whereParams, wallet_id: user_wallet }
            }
            if (grouped) queryParams = { ...queryParams, distinct: ['collectible_id', 'unique_cover_id']}
            if (editionNumber) whereParams = { ...whereParams, edition: editionNumber }
            if (collectible_id) whereParams = { ...whereParams, collectible_id: collectible_id }
            if (unique_cover_id) whereParams = { ...whereParams, unique_cover_id: unique_cover_id }

            let tokens

            if (kraken){
                whereParams = { ...whereParams, tmp_unregistered_user: 'KRAKEN' }
                queryParams = { ...queryParams, where: { ...whereParams } }
                queryParams = {
                    ...queryParams,
                    include: {
                        collectible: {
                            select: {
                                floor_price: true
                            }
                        }
                    }
                }

                tokens = await prisma.veve_tokens.findMany(queryParams)

                // console.log('tokens is: ', tokens)
                let valuation = 0
                tokens.map((token) => {
                    if (token.collectible?.floor_price){
                        valuation += Number(token.collectible?.floor_price)
                    }
                })

                // let valuation = 0
                // const tokenCollectibleIds = await prisma.tokens.findMany({
                //     where: { tmp_unregistered_user: 'KRAKEN' },
                //     select: {
                //         collectible_id: true
                //     }
                // })
                // console.log('tokenCollectibleIds: ', tokenCollectibleIds)

                // tokens.map(async (token) => {
                //     const collectibleValue = await prisma.veve_collectibles.findMany({
                //         where: {
                //             collectible_id: token.collectible_id
                //         },
                //         select: {
                //             floor_price: true
                //         }
                //     })
                //     collectibleValue.map((value) => {
                //         console.log('value is: ', value.floor_price)
                //         valuation += Number(value.floor_price)
                //     })
                //     console.log('valuation is: ', valuation)
                // })

                return {
                    edges: tokens,
                    pageInfo: {
                        endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                    },
                    summary: {
                        valuation: valuation,
                        count: tokens.length
                    }
                }
            }
            queryParams = { ...queryParams, where: { ...whereParams } }

            if (token_id) {
                tokens = [await prisma.veve_tokens.findUnique({where: {token_id: Number(token_id)}})]
            } else {
                tokens = await prisma.veve_tokens.findMany(queryParams)
            }

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }

        },
        getVeveVerificationCode: async (_, { collectibleId, edition }, { userInfo, prisma }) => {

            try {
                if (!userInfo.sub) throw new GraphQLError('Unauthorised');

                // Check if a veve_profile already exists for the user
                let userVeveProfile = await prisma.veve_profile.findUnique({
                    where: {
                        userId: userInfo.sub
                    }
                });

                // If veve_profile exists and has a verification code, return it
                if (userVeveProfile && userVeveProfile.verification_code) {
                    return {
                        code: userVeveProfile.verification_code,
                        collectible_id: userVeveProfile.collectible_id,
                        edition: userVeveProfile.edition
                    }
                }

                const verificationCode = Math.floor(Math.random() * (10000000 - 2000000) + 2000000);

                // If no veve_profile exists, create one
                if (!userVeveProfile) {
                    await prisma.veve_profile.create({
                        data: {
                            userId: userInfo.sub,
                            verification_code: verificationCode,
                            collectible_id: collectibleId,
                            edition: Number(edition)
                        }
                    });
                }
                // If veve_profile exists but has no verification code, update it
                else {
                    await prisma.veve_profile.update({
                        where: {
                            userId: userInfo.sub
                        },
                        data: {
                            verification_code: verificationCode,
                            collectible_id: collectibleId,
                            edition: Number(edition)
                        }
                    });
                }

                return {
                    code: verificationCode,
                    collectible_id: collectibleId,
                    edition
                }

            } catch (e) {
                throw new GraphQLError('Unable to get or save verification code');
            }

        },
    },
    Mutation: {
        veveRequestVerify: async (_, __, { userInfo, prisma }) => {
            try {
                const verifyMeta = await prisma.veve_profile.findUnique({
                    where: {
                        userId: userInfo.sub
                    }
                })

                return await VEVE_VERIFY_USER(prisma, verifyMeta)
            } catch (e) {
                throw new GraphQLError('Unable to verify veve profile')
            }
        },
        veveVaultImport: async (_, { payload }, { userInfo, prisma, pubsub }) => {

            try {

                const token = await prisma.veve_tokens.findFirst({
                    where: {
                        collectible_id: payload.collectible_id,
                        edition: payload.edition
                    },
                    select: {
                        token_id: true,
                    },
                })

                const { token_id } = token

                const getImxOwner = await fetch(`https://api.x.immutable.com/v1/assets/0xa7aefead2f25972d80516628417ac46b3f2604af/${token_id}`)
                const imxOwner = await getImxOwner.json()
                const wallet_address = await imxOwner.user

                await pubsub.publish('VEVE_VAULT_IMPORT', {
                    veveVaultImport: {
                        user_id: userInfo.sub,
                        message: `Wallet found: ${truncate(wallet_address, 20)}`,
                        complete: false
                    }
                })

                const walletClaimed = await prisma.veve_wallets.findUnique({
                    where: {
                        id: wallet_address,
                    },
                    select: {
                        user_id: true
                    }
                })

                const tokens = await prisma.veve_tokens.count({
                    where: {
                        wallet_id: wallet_address
                    }
                })

                if (!walletClaimed.user_id){
                    await prisma.veve_wallets.update({
                        where: {
                            id: wallet_address
                        },
                        data: {
                            user_id: userInfo.sub
                        }
                    })

                    const existingAssociation = await prisma.userToProjects.findUnique({
                        where: {
                            userId_collectionId: {
                                userId: userInfo.sub,
                                project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d",
                            },
                        },
                    });

                    if (!existingAssociation) {
                        await prisma.userToProjects.create({
                            data: {
                                userId: userInfo.sub,
                                project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d",
                            },
                        });
                    }

                    await prisma.user.update({
                        where: {
                            id: userInfo.sub
                        },
                        data: {
                            onboarded: true
                        }
                    })

                    await pubsub.publish('VEVE_VAULT_IMPORT', {
                        veveVaultImport: {
                            user_id: userInfo.sub,
                            message: `Your vault has been successfully imported, thank you.`,
                            complete: true
                        }
                    })

                    return {
                        "wallet_address": wallet_address,
                        "token_count": tokens,
                        "claimed": false
                    }

                } else {
                    return {
                        "wallet_address": wallet_address,
                        "token_count": tokens,
                        "claimed": true
                    }
                }
            } catch (e) {
                console.log('Failed to get token: ', e)
                throw new GraphQLError('That token has not yet been minted.')
            }

        },
        addToWatchlist: async (_, { collectibleId, uniqueCoverId }, { userInfo, prisma }) => {

            try {
                if (uniqueCoverId){
                    await prisma.veve_watchlist.create({
                        data:{
                            user_id: userInfo.sub,
                            unique_cover_id: uniqueCoverId
                        }
                    })

                    return true
                }

                if (collectibleId){
                    await prisma.veve_watchlist.create({
                        data:{
                            user_id: userInfo.sub,
                            collectible_id: collectibleId
                        }
                    })

                    return true
                }
            } catch (e) {
                console.log('addtowatchlistfailed: ', e)
                return false
            }

        },
    },
    Subscription: {
        veveVaultImport: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['VEVE_VAULT_IMPORT'])
        },
        // veveCollectiblePrice: {
        //     subscribe: async (_, {collectible_id}, { pubsub }) => {
        //         console.log('sub id is: ', collectible_id)
        //         return pubsub.asyncIterator([`VEVE_COLLECTIBLE_UPDATED`])
        //     }
        // }
        veveCollectiblePrice: {
            subscribe: (_, { veveCollectiblePrice }, { pubsub }) => {
                return pubsub.asyncIterator(['VEVE_PRICES_UPDATED'])
            }
        }
    },
    User: {},
    Collectible: {
        tokens: async ({collectible_id}, {sortOptions, pagingOptions}, { prisma }) => {
            let limit = 15
            let sortParams = { edition: 'asc' }
            let queryParams = {}
            let whereParams = { "collectibleId" : collectible_id }
            if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }
            if (pagingOptions){
                if (pagingOptions.limit) limit = pagingOptions.limit
                if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(pagingOptions.after)) }}
            }
            queryParams = { ...queryParams, take: limit, orderBy: [sortParams], where: { ...whereParams } }

            const tokens = await prisma.veve_tokens.findMany(queryParams)

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }
        },
        brand: async ({ brand_id }, __ ,{ prisma }) => {
            return await prisma.brands.findUnique({
                where: {
                    brand_id
                }
            })
        },
        quantity: async ({ collectible_id }, __, { prisma, userInfo, loaders }) => {
            try {
                const userWallet = await loaders.wallet.load(userInfo.sub);

                if (!userWallet) throw new Error('User wallet not found');

                return await prisma.veve_tokens.count({
                    where: {
                        collectible_id: collectible_id,
                        wallet_id: userWallet.id,
                    },
                });
            } catch (err) {
                console.error('Error counting collectibles:', err);
                throw new GraphQLError('Could not count collectibles.');
            }
        },
        valuations: async ({ collectible_id }, { period }, { prisma }) => {
            switch (period){
                case 1:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 2:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (48 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 7:
                    console.log('7 day period...')
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 28 || 30:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 90:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                default:
                    return [await CollectiblePrice.aggregate([
                        {
                            "$match": {
                                collectibleId: collectible_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
            }
        },
        watching: async ({ collectible_id }, __, { prisma, userInfo }) => {
            try {
                const watching = await prisma.veve_watchlist.findFirst({
                    where: {
                        user_id: userInfo.sub,
                        collectible_id: collectible_id
                    }
                })
                return !!watching
            } catch (e) {
                throw new GraphQLError('Could not determine watchlist.')
            }
        },
    },
    Comic: {
        tokens: async ({uniqueCoverId}, {sortOptions, pagingOptions}, { prisma }) => {
            let limit = 15
            let sortParams = { edition: 'asc' }
            let queryParams = {}
            let whereParams = { "uniqueCoverId" : uniqueCoverId }
            if (sortOptions) sortParams = { [sortOptions.sortField]: sortOptions.sortDirection }
            if (pagingOptions){
                if (pagingOptions.limit) limit = pagingOptions.limit
                if (pagingOptions.after) queryParams = { ...queryParams, skip: 1, cursor: { token_id: Number(decodeCursor(pagingOptions.after)) }}
            }
            queryParams = { ...queryParams, take: limit, orderBy: [sortParams], where: { ...whereParams } }

            const tokens = await prisma.veve_tokens.findMany(queryParams)

            return {
                edges: tokens,
                pageInfo: {
                    endCursor: tokens.length > 1 ? encodeCursor(String(tokens[tokens.length - 1].token_id)) : null
                }
            }

        },
        quantity: async ({ unique_cover_id }, __, { prisma, userInfo }) => {
            try {
                const user_wallet = await prisma.veve_wallets.findFirst({
                    where: {
                        user_id: userInfo.sub
                    },
                    select: {
                        id: true
                    }
                })
                return await prisma.veve_tokens.count({
                    where: {
                        unique_cover_id: unique_cover_id,
                        wallet_id: user_wallet.id
                    },
                })
            } catch(err) {
                throw new GraphQLError('Could not count comics.')
            }
        },
        valuations: async ({ unique_cover_id }, { period }, { prisma }) => {
            switch (period){
                case 1:
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 2:
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (48 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 7:
                    console.log('7 day period...')
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 28 || 30:
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                case 90:
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
                default:
                    return [await ComicPrice.aggregate([
                        {
                            "$match": {
                                uniqueCoverId: unique_cover_id,
                                "date": {
                                    $gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
                                }
                            }
                        },
                    ])]
            }
        },
        watching: async ({ unique_cover_id }, __, { prisma, userInfo }) => {
            try {
                const watching = await prisma.veve_watchlist.findFirst({
                    where: {
                        user_id: userInfo.sub,
                        unique_cover_id: unique_cover_id
                    }
                })
                return !!watching
            } catch (e) {
                throw new GraphQLError('Could not determine watchlist.')
            }
        },
    },
    Token: {
        collectible: async ({ type, collectible_id, lang }, __, { loaders }) => {
            if (type !== 'collectible') return null;
            return await loaders.collectible.load(collectible_id, lang);
        },
        comic: async ({ type, unique_cover_id }, __, { loaders }) => {
            if (type !== 'comic') return null;
            return await loaders.comic.load(unique_cover_id);
        },
        transfers: async ({ token_id, wallet_id, type }, __, { loaders }) => {
            try {
                const compoundKey = { tokenId: token_id, walletId: wallet_id };
                return await loaders.transfer.load(compoundKey);
            } catch (e) {
                console.log('transfers err: ', e);
                throw new GraphQLError('Could not get user transfers for this token.', e);
            }
        },
    },
}

export default resolvers