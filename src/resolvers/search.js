import {GraphQLError} from "graphql"

const resolvers = {
    Query: {
        getRecentSearches: async (_, { __ }, { prisma }) => {
            return await prisma.recent_search.findMany({
                orderBy: { timestamp: 'desc' },
            });
        },
        getPopularSearches: async (_, __, { prisma }) => {
            const lastWeek = new Date(new Date().setDate(new Date().getDate() - 7));
            const searches = await prisma.recent_search.groupBy({
                by: ['search_term'],
                _count: true,
                where: {
                    timestamp: {
                        gte: lastWeek,
                    },
                },
                orderBy: {
                    _count: {
                        searchTerm: 'desc',
                    },
                },
                take: 10,
            });

            return searches.map(search => search.searchTerm);
        },
        searchWriters: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('writers').search(query, {
                    limit,
                    attributesToRetrieve: ['author_id', 'name', 'image'],
                    attributesToHighlight: ['name']
                });
                return {
                    totalHits: response.estimatedTotalHits,
                    hits: response.hits.map(hit => ({
                        author_id: hit.author_id,
                        name: hit.name,
                        image: hit.image
                    })),
                };
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchArtists: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('artists').search(query, {
                    limit,
                    attributesToRetrieve: ['artist_id', 'name', 'image'],
                    attributesToHighlight: ['name']
                });
                return {
                    totalHits: response.estimatedTotalHits,
                    hits: response.hits.map(hit => ({
                        artist_id: hit.artist_id,
                        name: hit.name,
                        image: hit.image
                    })),
                };
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchCharacters: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('characters').search(query, {
                    limit,
                    attributesToRetrieve: ['character_id', 'name', 'image'],
                    attributesToHighlight: ['name']
                });
                return {
                    totalHits: response.estimatedTotalHits,
                    hits: response.hits.map(hit => ({
                        character_id: hit.character_id,
                        name: hit.name,
                        image: hit.image
                    })),
                };
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchCollectibles: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('collectibles').search(query, {
                    limit,
                    attributesToRetrieve: [
                        'id', 'name', 'slug', 'rarity', 'edition_type',
                        'tags', 'image', 'project_id', 'project_motiff_url',
                        'comic_number', 'artists', 'characters', 'writers'
                    ],
                });

                return {
                    totalHits: response.estimatedTotalHits,
                    hits: response.hits.map(hit => ({
                        // id: hit.id.split('_')[1],
                        id: hit.id,
                        name: hit.name,
                        rarity: hit.rarity,
                        slug: hit.slug,
                        edition_type: hit.edition_type,
                        image_thumbnail_url: hit.image,
                        motiff_url: hit.project_motiff_url,
                        tags: hit.tags,
                        comic_number: hit.comic_number,
                        artists: hit.artists,
                        characters: hit.characters,
                        writers: hit.writers,
                    })),
                };
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchBrands: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('brands').search(query, {
                    limit,
                    attributesToRetrieve: ['brand_id', 'name', 'square_image_thumbnail_url'],
                    attributesToHighlight: ['name']
                });

                return response.hits.map(hit => ({
                    brand_id: hit.brand_id,
                    name: hit.name,
                    square_image_thumbnail_url: hit.square_image_thumbnail_url
                }));
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchLicensors: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('licensors').search(query, {
                    limit,
                    attributesToRetrieve: ['licensor_id', 'name', 'square_image_thumbnail_url'],
                    attributesToHighlight: ['name']
                })

                return response.hits.map(hit => ({
                    series_id: hit.series_id,
                    name: hit.name,
                    square_image_thumbnail_url: hit.square_image_thumbnail_url
                }))
            } catch (error) {
                console.log('Meilisearch series failed: ', error)
                throw new GraphQLError('Failed to search in MeiliSearch')
            }
        },
        searchVeveSeries: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('veve_series').search(query, {
                    limit,
                    attributesToRetrieve: ['series_id', 'name', 'square_image_thumbnail_url'],
                    attributesToHighlight: ['name']
                })

                return response.hits.map(hit => ({
                    series_id: hit.series_id,
                    name: hit.name,
                    square_image_thumbnail_url: hit.square_image_thumbnail_url
                }))
            } catch (error) {
                console.log('Meilisearch series failed: ', error)
                throw new GraphQLError('Failed to search in MeiliSearch')
            }
        },
    },
    Mutation: {
        createRecentSearch: async (_, { search_term }, { prisma, userInfo }) => {
            return await prisma.recentSearch.create({
                data: {
                    user_id: userInfo.sub,
                    search_term,
                },
            });
        },
    }
}

export default resolvers