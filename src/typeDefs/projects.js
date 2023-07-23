import gql from 'graphql-tag'

export const typeDefs = gql`

    type Query {
        projects(id: ID, name: String, active: Boolean): [Project]
    }

    type Mutation {
        createProject(name: String!, abbr: String, active: Boolean) : Project #Admin only
    }

    type Project {
        id: ID!
        name: String!
        abbr: String
        active: Boolean!
        slug: String
        icon: String
        tile: String
        motiff_url: String
        users: [User]
    }

`

export default typeDefs