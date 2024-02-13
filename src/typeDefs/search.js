import gql from "graphql-tag"

const typeDefs = gql`
    
    extend type Query {
        getRecentSearches(userId: String!): [RecentSearch!]!
        getPopularSearches: [String!]!
        searchWriters(query: String! limit: Int): WrtiersSearchResult
        searchArtists(query: String! limit: Int): ArtistsSearchResult
        searchCharacters(query: String! limit: Int): CharactersSearchResult
        searchCollectibles(query: String!, limit: Int): CollectibleSearchResult
        searchBrands(query: String!, limit: Int): [BrandsSearchPayload]
        searchLicensors(query: String!, limit: Int): [LicensorsSearchPayload]
        searchVeveSeries(query: String!, limit: Int): [VeveSeriesSearchPayload]
    }
    
    extend type Mutation {
        createRecentSearch(search_term: String!): String!
    }

    type RecentSearch {
        id: ID!
        userId: String!
        searchTerm: String!
        timestamp: String!
    }
    
    type CharactersSearchResult {
        totalHits: Int
        hits: [CharactersSearchPayload!]!
    }

    type CharactersSearchPayload {
        character_id: String!
        name: String
        image: String
    }
    
    type ArtistsSearchResult {
        totalHits: Int
        hits: [ArtistsSearchPayload!]!
    }

    type ArtistsSearchPayload {
        artist_id: String!
        name: String
        image: String
    }
    
    type WrtiersSearchResult {
        totalHits: Int
        hits: [WritersSearchPayload!]!
    }

    type WritersSearchPayload {
        author_id: String!
        name: String
        image: String
    }

    type LicensorsSearchPayload {
        licensor_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type VeveSeriesSearchPayload {
        series_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type BrandsSearchPayload {
        brand_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type CollectibleSearchResult {
        totalHits: Int
        hits: [CollectibleSearchPayload!]!
    }

    type CollectibleSearchPayload {
        id: String!
        name: String
        slug: String
        rarity: String
        edition_type: String
        tags: String
        image_thumbnail_url: String
        motiff_url: String
        comic_number: Int
        artists: String
        characters: String
        writers: String
    }
    
`

export default typeDefs