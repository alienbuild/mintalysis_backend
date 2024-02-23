import gql from "graphql-tag";

const typeDefs = gql`
    
    type Query {
        affiliates: [Affiliate!]!
        affiliateReferrals(affiliateId: String!): [AffiliateReferral!]!
        myAffiliateAccount: Affiliate!
        myReferrals: [AffiliateReferral!]!
        affiliatePayouts: [Payout!]!
    }
    
    type Mutation {
        createAffiliateAccount: AffiliateAccountResponse!
        updateAffiliate(rewardful_id: String!, email: String, first_name: String, last_name: String): AffiliateResponse!
        trackAffiliateReferral(affiliate_id: String!, referral_code: String!, referred_user: String!): AffiliateReferralResponse!
        createAffiliateReferral(referral_code: String!, referred_user: String!): AffiliateReferralResponse!
        updateCommissionStatus(referral_id: Int!, status: String!): AffiliateReferralResponse!
        updateAffiliateDetails(email: String, firstName: String, lastName: String): AffiliateResponse!
        createAffiliatePayout(affiliateAccountId: ID!, amount: Float!, payoutDate: DateTime!): PayoutResponse!
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
        id: ID!
        user_id: String!
        email: String!
        first_name: String
        last_name: String
        rewardful_id: String!
        referrals: [AffiliateReferral!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type AffiliateReferral {
        id: ID!
        affiliate_Id: String!
        referral_code: String!
        referred_user: String!
        commission_earned: Float!
        createdAt: DateTime!
        status: String!
    }

    type AffiliateAccountResponse {
        success: Boolean!
        message: String!
        affiliate_Account: AffiliateAccount
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