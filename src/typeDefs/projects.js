import {gql} from "apollo-server-express"

export const typeDefs = gql`

    type Query {
        projects(id: ID, name: String): [Project]
    }

    type Mutation {
        createProject(name: String!, abbr: String, active: Boolean) : Project #Admin only
    }

    type Project {
        id: ID!
        name: String!
        abbr: String
        active: Boolean!
        users: [User]
    }

`

export default typeDefs