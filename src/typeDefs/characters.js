import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getCharacters(characterId: String, slug: String, pagingOptions: pagingOptions, search: String) : CharacterConnection
    }
    
    type CharacterConnection {
        edges: [Character]!
        totalCount: Int
        pageInfo: PageInfo!
    }
    
    type Character {
        character_id: String
        name: String
        comic: Comic
    }
    
`

export default typeDefs