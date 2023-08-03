import gql from "graphql-tag"

const typeDefs = gql`
    type Mutation {
        sendFeedback(payload: FeedbackInput): Boolean
    }
    
    input FeedbackInput {
        opinion: String!
        type: String!
        locale: String
        url: String!
        message: String!
    }
`

export default typeDefs