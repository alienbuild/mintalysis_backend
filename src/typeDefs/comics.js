import { gql } from "apollo-server-express"

const typeDefs = gql`
    
    type Query {
        comics(search: String, limit: Int, after: String) : ComicsConnection
    }

    type ComicsConnection {
        edges: [Comic!]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type Comic {
        uniqueCoverId: String!
        name: String!
        rarity: String!
        description: String!
        comic_number: Int!
        comic_series_id: String!
        image_thumbnail: String!
        image_low_resolution_url: String
        image_med_resolution_url: String
        image_full_resolution_url: String
        image_high_resolution_url: String
        image_direction: String
        drop_date: String
        drop_method: String
        start_year: Int
        page_count: Int
        store_price: Float
        publisher_id: String
        market_fee: Float
        total_issued: Int
        total_available: Int
        is_free: Boolean
        is_unlimited: Boolean
        all_time_high: Float
        all_time_low: Float
        floor_price: Float
        market_cap: Float
        one_day_change: Float
        one_mo_change: Float
        one_wk_change: Float
        one_year_change: Float
        six_mo_change: Float
        three_mo_change: Float
        total_listings: Int
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
    }

`

export default typeDefs