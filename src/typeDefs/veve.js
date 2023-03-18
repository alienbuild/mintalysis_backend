import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        validateVeveUsername(username: String!): [String!]!
        veveCollectiblePriceData(collectibleId: String! type: String! period: DateTime): [VeveCollectiblePriceDataPayload]
        veveCollectibles(collectibleId: String, pagingOptions: pagingOptions, sortOptions: sortOptions, search: String, filterOptions: filterOptions): CollectiblesConnection
        veveComics(uniqueCoverId: String, search: String, limit: Int, after: String): ComicsConnection
        veveSeries(collectibleId: String, brandId: String, pagingOptions: pagingOptions, sortOptions: sortOptions, search: String): CollectiblesConnection
        veveDropDates(startDate: String, endDate: String) : [VeveDropDatePayload]
        veveValuations : VeveValuationsPayload
        getCollectibleWatchlist(pagingOptions: pagingOptions): CollectibleWatchlistConnection
        getComicWatchlist(pagingOptions: pagingOptions): ComicWatchlistConnection
        getUserMagicSet(seriesId: String) : [MagicMintSet]
        getUsersVeveTokens(grouped: Boolean, token_id: ID, editionNumber: Int, type: String, userId: String, search: String, pagingOptions: pagingOptions, collectible_id: String, unique_cover_id: String) : TokensConnection
        tokens(token_id: ID, editionNumber: Int, type: String, userId: String, search: String, limit: Int, after: String, collectible_id: String, unique_cover_id: String, kraken: Boolean) : TokensConnection
    }
    
    type Mutation {
        veveVaultImport(payload: VaultImportInput) : VeveVaultImportPayload! #Auth only
        updateLastSeen(last_seen: String) : Boolean
        addToWatchlist(collectibleId: String, uniqueCoverId: String, type: String!) : Boolean
    }
    
    type Subscription {
        veveCollectiblePrice(collectible_id: String): DateTime
        veveVaultImport: VeveVaultImportSubcriptionPayload
    }
    
    type ComicWatchlistConnection {
        edges: [Comic]!
        pageInfo: PageInfo!
    }
    
    type CollectibleWatchlistConnection {
        edges: [Collectible]!
        pageInfo: PageInfo!
    }
    
    type VeveValuationsPayload {
        collectibles: Float
        comics: Float
        total: Float
    }

    type VeveDropDatePayload {
        collectible_id: String!
        name: String!
        rarity: String!
        store_price: Float
        image_thumbnail_url: String
        total_issued: Int
        drop_date: DateTime
    }

    type TokensConnection {
        edges: [Token]!
        totalCount: Int
        pageInfo: PageInfo!
        summary: WalletSummary
    }

    type Token {
        token_id: ID!
        name: String
        edition: Int
        mint_date: String
        rarity: String
        collectible_id: String
        unique_cover_id: String
        type: String
        last_updated: String
        brand_id: String
        licensor_id: String
        series_id: String
        transfers(type: String): [Transfers]
        collectible: Collectible 
        comic: Comic
    }

    type Transfers {
        id: Int
        from_wallet: String
        to_wallet: String
        timestamp: DateTime
        token_id: String
        entry_price: Float
        break_even: Float
    }
    
    type MagicMintSet {
        set: [VeveSet]
        count: Float
        edition: Float
        series_name: String
        season: Float
        setTotal: Float
    }
    
    type VeveSet {
        name: String
        edition: Float
        rarity: String
    }
    
    type VeveCollectiblePriceDataPayload { 
        _id: VeveCollectiblePriceDataPayloadId
        date: Float
        value: Float
        open: Float
        high: Float
        low: Float
        volume: Float
    }
    
    type VeveCollectiblePriceDataPayloadId { 
        symbol: String
        date: DateTime
    }

    type VeveVaultImportPayload {
        wallet_address: String!
        token_count: Int!
    }
    
    type VeveVaultImportSubcriptionPayload {
        user_id: String
        message: String
        complete: Boolean
    }

    type ComicsConnection {
        edges: [Comic!]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type Comic {
        unique_cover_id: String!
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
        quantity: Int
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
        valuations(period: Int) : [[VEVEValuationObj]]
        watching: Boolean
    }

    type CollectiblesConnection {
        edges: [Collectible]!
        totalCount: Int
        pageInfo: PageInfo
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
        brand: Brand
        valuations(period: Int) : [[VEVEValuationObj]]
        watching: Boolean
    }
    
    type Brand {
        brand_id: String!
        name: String!
        description: String
        theme_logo_url: String
        theme_logo_image_thumbnail_url: String
        theme_logo_image_low_resolution_url: String
        theme_logo_image_med_resolution_url: String
        theme_logo_image_full_resolution_url: String
        theme_logo_image_high_resolution_url: String
        theme_logo_image_direction: String
        theme_background_image_url: String
        theme_background_image_thumbnail_url: String
        theme_background_image_low_resolution_url: String
        theme_background_image_med_resolution_url: String
        theme_background_image_full_resolution_url: String
        theme_background_image_high_resolution_url: String
        theme_background_image_direction: String
        theme_footer_image_url: String
        theme_footer_image_thumbnail_url: String
        theme_footer_image_low_resolution_url: String
        theme_footer_image_med_resolution_url: String
        theme_footer_image_full_resolution_url: String
        theme_footer_image_high_resolution_url: String
        theme_footer_image_direction: String
        landscape_image_url: String
        landscape_image_thumbnail_url: String
        landscape_image_low_resolution_url: String
        landscape_image_med_resolution_url: String
        landscape_image_full_resolution_url: String
        landscape_image_high_resolution_url: String
        landscape_image_direction: String
        square_image_url: String
        square_image_thumbnail_url: String
        square_image_low_resolution_url: String
        square_image_med_resolution_url: String
        square_image_full_resolution_url: String
        square_image_high_resolution_url: String
        square_image_direction: String
        licensor_id: String
        slug: String     
        tokens(pagingOptions: pagingOptions, sortOptions: sortOptions): TokensConnection!
    }
    
`

export default typeDefs