import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getEcologiStats: EcologiStats
    }
    
    type EcologiStats {
        trees: Float
        carbon: Float
        habitat: Float
        carbon_removed: Float
        userCount: Float
    }
`

export default typeDefs