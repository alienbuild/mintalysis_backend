import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getSubscriber(email: String!): NewsletterSubscriber
        checkSubscription(email: String!, project_id: String!): Boolean
    }
    
    type Mutation {
        subscribeToGeneralNewsletter(email: String!): NewsletterSubscriber
        subscribeToProjectNewsletter(email: String!, project_id: String!): NewsletterSubscriber
    }

    type NewsletterSubscriber {
        id: ID!
        email: String!
        newsletters: [ProjectNewsletter]
    }
`

export default typeDefs