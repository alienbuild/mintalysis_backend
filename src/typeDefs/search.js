import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        searchWriters(query: String! limit: Int): WrtiersSearchResult
        searchArtists(query: String! limit: Int): ArtistsSearchResult
        searchCharacters(query: String! limit: Int): CharactersSearchResult
        searchVeveCollectibles(query: String!, limit: Int): VeveCollectibleSearchResult
        searchVeveBrands(query: String!, limit: Int): [VeveBrandsSearchPayload]
        searchVeveSeries(query: String!, limit: Int): [VeveSeriesSearchPayload]
        searchVeveLicensors(query: String!, limit: Int): [VeveLicensorsSearchPayload]
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

    type VeveLicensorsSearchPayload {
        licensor_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type VeveSeriesSearchPayload {
        series_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type VeveBrandsSearchPayload {
        brand_id: String!
        name: String
        square_image_thumbnail_url: String
    }

    type VeveCollectibleSearchResult {
        totalHits: Int
        hits: [VeveCollectibleSearchPayload!]!
    }

    type VeveCollectibleSearchPayload {
        collectible_id: String!
        name: String
        rarity: String
        edition_type: String
        tags: String
        image_thumbnail_url: String
        motiff_url: String
    }
    
`

export default typeDefs