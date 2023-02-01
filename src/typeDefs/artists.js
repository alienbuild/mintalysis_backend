import gql from "graphql-tag"

const typeDefs = gql`

    type Query {
        getArtists(artistId: String, slug: String, pagingOptions: pagingOptions, search: String) : ArtistConnection
    }

    type ArtistConnection {
        edges: [Artist]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type Artist {
        artist_id: String
        name: String
    }

`

export default typeDefs