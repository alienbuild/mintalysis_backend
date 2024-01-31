import {GraphQLError} from "graphql"

const resolvers = {
    Query: {
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
        searchVeveCollectibles: async (_, { query, limit = 10 }, { meili }) => {
            try {
                const response = await meili.index('veve_collectibles').search(query, {
                    limit,
                    attributesToRetrieve: ['collectible_id', 'name', 'rarity', 'edition_type', 'tags.name', 'image_thumbnail_url', 'project.motiff_url'],
                    attributesToHighlight: ['name', 'tags.name']
                });

                return {
                    totalHits: response.estimatedTotalHits,
                    hits: response.hits.map(hit => ({
                        collectible_id: hit.collectible_id,
                        name: hit.name,
                        rarity: hit.rarity,
                        edition_type: hit.edition_type,
                        image_thumbnail_url: hit.image_thumbnail_url,
                        motiff_url: hit.project.motiff_url,
                        tags: hit.tags ? hit.tags.map(tag => tag.name).join(', ') : null
                    })),
                };
            } catch (error) {
                console.error('MeiliSearch failed:', error);
                throw new GraphQLError('Failed to search in MeiliSearch');
            }
        },
        searchVeveBrands: async (_, { query, limit = 10 }, { meili }) => {
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
        searchVeveLicensors: async (_, { query, limit = 10 }, { meili }) => {
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
    }
}

export default resolvers