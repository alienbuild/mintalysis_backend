import gql from "graphql-tag";

const typeDefs = gql`
    
    type Query {
        affiliates: [Affiliate!]!
        affiliateReferrals(affiliate_id: String!): [AffiliateReferral!]!
        myAffiliateAccount: Affiliate!
        myReferrals: [AffiliateReferral!]!
        affiliatePayouts: [Payout!]!
        affiliateMetrics: AffiliateMetrics!
        conversionDetails(affiliate_account_id: ID!): [ConversionDetail!]!
        getAffiliateMonthlySummaries(affiliate_id: ID!): [AffiliateMonthlySummary!]!
    }
    
    type Mutation {
        createAffiliateAccount(first_name: String, last_name: String, paypal_email: String, promotional_channels: [String], is_customer_referrer: Boolean): AffiliateAccountResponse!
        updateAffiliate(email: String, first_name: String, last_name: String): AffiliateResponse!
        trackAffiliateReferral(affiliate_id: String!, referral_code: String!, referred_user: String!): AffiliateReferralResponse!
        createAffiliateReferral(referral_code: String!, referred_user: String!): AffiliateReferralResponse!
        updateCommissionStatus(referral_id: Int!, status: String!): AffiliateReferralResponse!
        createAffiliatePayout(affiliateAccountId: ID!, amount: Float!, payoutDate: DateTime!): PayoutResponse!
        generateReferralLink(affiliate_id: ID!, code: String): ReferralLinkResponse!
    }
    
    type AffiliateMonthlySummary {
        month: String!
        visitors: Int!
        leads: Int!
        conversions: Int!
        sales: Float!
        commissions: Float!
        netRevenue: Float!
    }
    
    type ReferralLinkResponse {
        success: Boolean!
        message: String!
        link: ReferralLink!
    }
    
    type ConversionDetail {
        id: ID!
        product: String!
        amount: Float!
        timestamp: DateTime!
        customer_identifier: String
        discount_applied: Float
        location: String
    }


    type AffiliateMetrics {
        totalReferrals: Int!
        totalConversions: Int! 
        clickThroughRate: Float!
        totalEarnings: Float!
        averageEarningsPerConversion: Float!
    }

    type PayoutResponse {
        success: Boolean!
        message: String!
        payout: Payout
    }
    
    type AffiliateResponse {
        success: Boolean!
        message: String!
        affiliate: Affiliate
    }

    type AffiliateReferralResponse {
        success: Boolean!
        message: String!
        referral: AffiliateReferral
    }

    type Affiliate {
        id: ID
        user_id: String
        email: String
        first_name: String
        last_name: String
        rewardful_id: String
        affiliate_id: String
        status: String
        referrals: [AffiliateReferral]
        links: [ReferralLink]
        createdAt: DateTime
        updatedAt: DateTime
    }

    type AffiliateReferral {
        id: ID!
        affiliate_id: String!
        referral_code: String!
        referred_user: String!
        commission_earned: Float!
        createdAt: DateTime!
        status: String!
    }

    type AffiliateAccountResponse {
        success: Boolean!
        message: String!
        affiliate_account: AffiliateAccount
    }
    
    type AffiliateAccount {
        id: ID!
        user_id: String!
        affiliate_id: String!
        status: String!
        createdAt: DateTime!
        updatedAt: DateTime!
        referral_links: [ReferralLink!]!
        conversions: [Conversion!]!
    }

    type ReferralLink {
        id: ID!
        affiliate_account_id: ID!
        link: String!
        visitors: Float!
        leads: Float!
        conversions: Float!
    }

    type Conversion {
        id: ID!
        affiliate_account_id: ID!
        sale_amount: Float!
        commission_amount: Float!
        createdAt: DateTime!
    }

    type Payout {
        id: ID!
        affiliate_account_id: ID!
        amount: Float!
        status: String!
        payout_date: DateTime!
    }

    
`

export default typeDefs