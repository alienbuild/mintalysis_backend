import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        currentUserSubscription: User
        subscriptionPlans: [SubscriptionPlan!]!
    }
    
    type Mutation {
        createCheckoutSession(priceId: String!): CheckoutSessionResponse!
        createSubscription(stripeToken: String!, priceId: String!): SubscriptionResponse!
        cancelSubscription: SubscriptionResponse!
        changeSubscriptionPlan(newPriceId: String!): SubscriptionResponse!
    }

    type CheckoutSessionResponse {
        success: Boolean!
        message: String!
        sessionUrl: String
    }

    scalar JSON
    
    type SubscriptionPlan {
        id: ID!
        stripe_price_id: String!
        name: String!
        description: String
        features: JSON
        prices: [SubscriptionPrice!]!
    }

    type SubscriptionPrice {
        id: ID!
        stripe_price_id: String!
        currency: String!
        amount: Float!
        interval: String!
    }
    
    type SubscriptionResponse {
        success: Boolean!
        message: String!
        user: User
    }
    
    extend type User {
        stripe_customer_id: String
        stripe_subscription_id: String
        subscription_status: String
    }
    
`

export default typeDefs