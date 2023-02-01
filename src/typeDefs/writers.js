import gql from "graphql-tag"

const typeDefs = gql`

    type Query {
        getWriters(authorId: String, slug: String, pagingOptions: pagingOptions, search: String) : WriterConnection
    }

    type WriterConnection {
        edges: [Writer]!
        totalCount: Int
        pageInfo: PageInfo!
    }

    type Writer {
        author_id: String
        name: String
    }

`

export default typeDefs