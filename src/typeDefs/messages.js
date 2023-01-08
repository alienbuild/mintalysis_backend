import {gql} from "apollo-server-express";

const typeDefs = gql`
    type Message {
        id: String
        sender: User
        body: String
        createdAt: DateTime
    }
`

export default typeDefs