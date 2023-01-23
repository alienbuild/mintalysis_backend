import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        collectibles(id: ID, search: String, limit: Int, after: String): CollectiblesConnection
    }

    type CollectiblesConnection {
        edges: [Collectible!]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type Collectible {
        collectible_id: String!
        name: String
        rarity: String
        description: String
        edition_type: String
        store_price: Float
        drop_date: String
        market_fee: Float
        createdAt: String
        updatedAt: String
        background_image_direction: String
        background_image_full_resolution_url: String
        background_image_high_resolution_url: String
        background_image_low_resolution_url: String
        background_image_med_resolution_url: String
        background_image_thumbnail_url: String
        background_image_url: String
        image_direction: String
        image_full_resolution_url: String
        image_high_resolution_url: String
        image_low_resolution_url: String
        image_med_resolution_url: String
        image_thumbnail_url: String
        image_url: String
        is_unlimited: Boolean
        total_available: Int
        total_issued: Int
        total_likes: Int
        variety: String
        brand_id: String
        licensor_id: String
        series_id: String
        drop_method: String
        is_free: String
        floor_price: Float
        market_cap: Float
        all_time_high: Float
        all_time_low: Float
        one_day_change: Float
        one_mo_change: Float
        one_wk_change: Float
        one_year_change: Float
        six_mo_change: Float
        three_mo_change: Float
        all_time_change: Float
        total_listings: Int
        quantity: Int
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
        valuations(period: Int) : [[VEVEValuationObj]]
    }
    
`

export default typeDefs