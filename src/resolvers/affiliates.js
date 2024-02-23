import {GraphQLError} from "graphql";

const resolvers = {

    Query: {
        affiliates: async (_, args, { prisma, userInfo }) => {
            if (!userInfo) throw new Error("Authentication required");
            return await prisma.rewardful_affiliate.findMany({
                where: { user_id: userInfo.sub }
            });
        },
        affiliateReferrals: async (_, { affiliate_id }, { prisma }) => {
            return await prisma.rewardful_affiliate_referral.findMany({
                where: { affiliate_id }
            });
        },
        myAffiliateAccount: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) throw new Error("Authentication required");
            return await prisma.rewardful_affiliate.findUnique({
                where: { user_id: userInfo.sub },
            });
        },
        myReferrals: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) throw new Error("Authentication required");
            return await prisma.rewardful_affiliate_referral.findMany({
                where: { affiliate: { user_id: userInfo.sub } },
            });
        },
        affiliatePayouts: async (_, __, { userInfo, prisma }) => {

            if (!userInfo) throw new Error("Authentication required");

            try {
                const user = await prisma.user.findUnique({
                    where: { id: userInfo.id },
                    select: { affiliate_account_id: true }
                })

                if (!user || !user.affiliate_account_id){
                    console.log('[ERROR][affiliatePayouts][STEP 1]: No affiliate_account id for user ', user)
                    throw new GraphQLError('Unable to fetch affiliate payouts for that user.')
                }

                return await prisma.rewardful_payout.findMany({
                    where: { affiliate_account_id:  user.affiliate_account_id },
                });
            } catch (error) {
                console.log('[ERROR][affiliatePayouts][CATCH]: ', error)
                throw new GraphQLError('Unable to fetch affiliate payouts for that user.')
            }

        },
    },
    Mutation: {
        createAffiliateAccount: async (_, __, { userInfo, prisma }) => {

            if (!userInfo) throw new Error("Authentication required");

            const rewardfulResponse = await createRewardfulAffiliate(userInfo, prisma);

            if (rewardfulResponse.success) {
                const affiliate_account = await prisma.rewardful_affiliate_account.create({
                    data: {
                        user_id: userInfo.sub,
                        affiliate_id: rewardfulResponse.affiliateId,
                        status: "active",
                        // Add more fields as required
                    },
                });
                return {
                    success: true,
                    message: "Affiliate account created successfully.",
                    affiliate_account,
                };
            } else {
                return {
                    success: false,
                    message: "Failed to create affiliate account in Rewardful.",
                };
            }
        },
        updateAffiliate: async (_, { rewardful_id, email, first_name, last_name }, { prisma }) => {
            try {
                const updatedAffiliate = await prisma.rewardful_affiliate.update({
                    where: { rewardful_id },
                    data: { email, first_name, last_name }
                });
                return { success: true, message: "Affiliate updated successfully", affiliate: updatedAffiliate };
            } catch (error) {
                console.error("Error updating affiliate:", error);
                return { success: false, message: "Failed to update affiliate", affiliate: null };
            }
        },
        trackAffiliateReferral: async (_, { affiliate_id, referral_code, referred_user }, { prisma }) => {
            try {
                const newReferral = await prisma.rewardful_affiliate_referral.create({
                    data: { affiliate_id, referral_code, referred_user, commission_earned: 0, status: "Pending" }
                });
                return { success: true, message: "Referral tracked successfully", referral: newReferral };
            } catch (error) {
                console.error("Error tracking referral:", error);
                return { success: false, message: "Failed to track referral", referral: null };
            }
        },
        createAffiliateReferral: async (_, { referral_code, referred_user }, { prisma, userInfo }) => {
            const affiliate = await prisma.affiliate.findUnique({ where: { userId: userInfo.sub } });
            if (!affiliate) {
                return { success: false, message: "Affiliate account not found." };
            }

            const referral = await prisma.rewardful_affiliate_referral.create({
                data: {
                    affiliate_id: affiliate.id,
                    referral_code,
                    referred_user,
                    commission_earned: 0,
                    status: "Pending",
                },
            });

            return { success: true, message: "Referral created successfully.", referral };
        },
        updateCommissionStatus: async (_, { referral_id, status }, { prisma }) => {
            const referral = await prisma.rewardful_affiliate_referral.update({
                where: { id: referral_id },
                data: { status },
            });

            return { success: true, message: "Commission status updated successfully.", referral };
        },
        updateAffiliateDetails: async (_, { email, firstName, lastName }, { userInfo, prisma }) => {
            if (!userInfo) throw new Error("Authentication required");

            try {
                const user = await prisma.user.findUnique({
                    where: { id: userInfo.id },
                    select: { affiliate_account_id: true }
                })

                if (!user || !user.affiliate_account_id){
                    console.log('[ERROR][updateAffiliateDetails][STEP 1]: No affiliate_account id for user ', user)
                    throw new GraphQLError('Unable to fetch affiliate payouts for that user.')
                }

                const updatedAffiliate = await prisma.rewardful_affiliate.update({
                    where: { id: user.affiliate_account_id },
                    data: { email, first_name: firstName, last_name: lastName },
                });

                return { success: true, message: "Affiliate details updated successfully", affiliate: updatedAffiliate };

            } catch (error) {
                console.log('[ERROR][updateAffiliateDetails][CATCH]: ', error)
                throw new GraphQLError('Unable to fetch affiliate payouts for that user.')
            }
        },
    }

}

const createRewardfulAffiliate = async (userInfo, prisma) => {

    const rewardfulBaseUrl = "https://api.getrewardful.com/v1/affiliates";

    try {
        const response = await fetch(rewardfulBaseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.REWARDFUL_API_SECRET}`
            },
            body: JSON.stringify({
                email: userInfo.email, // **
                // first_name: "", **
                // last_name: "", **
                // token: "",
                // campaign_id: "",
                // paypal_email: "",

                // stripe_customer_id: "",
                // Both normal affiliates and customer referrers can be created through this endpoint.
                // To create a customer referrer, simply pass the stripe_customer_id parameter that
                // indicates the Stripe Customer that should receive account credits as rewards.

            })
        });

        const data = await response.json();

        console.log('rewardful response data is: ', data)

        if (!response.ok) throw new Error(data.message || "Failed to create affiliate account in Rewardful.");

        // Assuming data.id is the affiliate ID from Rewardful, and it's successfully created
        // Now, you might want to save this information in your database
        await prisma.rewardful_affiliate_account.create({
            data: {
                user_id: userInfo.sub,
                affiliate_id: data.id,
                // Include other fields based on your schema and the data returned by Rewardful
            }
        });

        return {
            success: true,
            affiliateId: data.id,
        };
    } catch (error) {
        console.error("Error creating Rewardful affiliate:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

export default resolvers