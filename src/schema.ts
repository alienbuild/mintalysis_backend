import {gql} from "apollo-server";

export const typeDefs = gql`
    type Query {
        hello: String!
    }
    
    type Mutation {
    }
    
    type User {
        id: ID!
        name: String
        email: String!
        profile: Profile!
    }

    type Profile {
        id: ID!
        bio: String
        user: User!
    }
    
    type UserError {
        message: String!
    }

`