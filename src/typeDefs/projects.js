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
        icon: String
        users: [User]
    }

`

export default typeDefs