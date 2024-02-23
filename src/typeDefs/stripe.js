import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        currentUserSubscription: User
        subscriptionPlans: [SubscriptionPlan!]!
        userHasFeatureAccess(feature: String!): FeatureAccessResponse!
        fetchAccessRights: AccessRightsResponse!
        featureFlags: [FeatureFlag!]!
        userFeatureUsage(userId: ID!, featureFlagId: ID!): UserFeatureUsage
    }
    
    type Mutation {
        createCheckoutSession(priceId: String!): CheckoutSessionResponse!
        createSubscription(stripeToken: String!, priceId: String!): SubscriptionResponse!
        cancelSubscription: SubscriptionResponse!
        changeSubscriptionPlan(newPriceId: String!): SubscriptionResponse!
        verifyStripeSession(sessionId: String!): StripeVerificationResponse!
        updateUserFeatureUsage(feature_flag_id: ID!, count: Int!): UserFeatureUsage
    }

    enum LimitPeriod {
        DAILY
        WEEKLY
        MONTHLY
    }

    type FeatureFlag {
        id: ID!
        name: String!
        description: String
        enabled: Boolean!
        usage_limit: Int
        limit_period: LimitPeriod
    }

    type UserFeatureUsage {
        id: ID!
        feature_flag: FeatureFlag!
        usage_count: Int!
        timestamp: String!
    }


    type AccessRightsResponse {
        success: Boolean!
        message: String
        rights: [FeatureAccess!]!
    }

    type FeatureAccess {
        featureKey: String!
        hasAccess: Boolean!
    }

    type FeatureAccessResponse {
        hasAccess: Boolean!
        message: String
    }

    type CheckoutSessionResponse {
        success: Boolean!
        message: String!
        sessionUrl: String
    }

    type StripeVerificationResponse {
        success: Boolean!
        message: String!
        user: User 
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