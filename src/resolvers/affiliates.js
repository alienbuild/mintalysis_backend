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
            const affiliate = await prisma.rewardful_affiliate.findUnique({
                where: { rewardful_id: affiliate_id },
            });

            if (!affiliate) {
                throw new Error("Affiliate not found");
            }

            return await prisma.rewardful_affiliate_referral.findMany({
                where: {affiliate_id: affiliate.id},
            });
        },
        myAffiliateAccount: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) throw new Error("Authentication required");

            try {
                // Assuming `user_id` in `rewardful_affiliate` links to `rewardful_affiliate_account` via `userId`
                const affiliateAccount = await prisma.rewardful_affiliate_account.findUnique({
                    where: { userId: userInfo.sub },
                    include: {
                        // Include related affiliate data and referrals
                        affiliate: {
                            select: {
                                id: true,
                                email: true,
                                first_name: true,
                                last_name: true,
                                rewardful_id: true,
                                createdAt: true,
                                updatedAt: true,
                                referrals: {
                                    select: {
                                        id: true,
                                        referral_code: true,
                                        referred_user: true,
                                        commission_earned: true,
                                        createdAt: true,
                                        status: true,
                                    },
                                },
                            },
                        },
                        referral_links: {
                            select: {
                                id: true,
                                link: true,
                                visitors: true,
                                leads: true,
                                conversions: true
                            }
                        }
                    },
                });

                if (!affiliateAccount) {
                    throw new Error("Affiliate account not found");
                }

                // Format the result to match your GraphQL type
                const result = {
                    id: affiliateAccount.id,
                    user_id: userInfo.sub,
                    email: affiliateAccount.affiliate.email,
                    first_name: affiliateAccount.affiliate.first_name,
                    last_name: affiliateAccount.affiliate.last_name,
                    rewardful_id: affiliateAccount.affiliate.rewardful_id,
                    affiliate_id: affiliateAccount.affiliate_id,
                    status: affiliateAccount.status,
                    referrals: affiliateAccount.affiliate.referrals,
                    links: affiliateAccount.referral_links,
                    createdAt: affiliateAccount.affiliate.createdAt,
                    updatedAt: affiliateAccount.affiliate.updatedAt,
                };

                return result;
            } catch (e) {
                console.log('Error getting my affiliate account: ', e);
                throw new Error('Error retrieving affiliate account information');
            }
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
                const affiliateAccount = await prisma.rewardful_affiliate_account.findUnique({
                    where: { userId: userInfo.sub },
                });

                if (!affiliateAccount) {
                    console.log('[ERROR][affiliatePayouts]: No affiliate account for user ', userInfo.sub);
                    throw new GraphQLError('Unable to fetch affiliate payouts for that user.');
                }

                return await prisma.rewardful_payout.findMany({
                    where: { affiliate_account_id: affiliateAccount.id },
                });
            } catch (error) {
                console.log('[ERROR][affiliatePayouts][CATCH]: ', error);
                throw new GraphQLError('Unable to fetch affiliate payouts for that user.');
            }
        },
        affiliateMetrics: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const totalReferrals = await prisma.rewardful_affiliate_referral.count({
                where: {
                    affiliate: {
                        user_id: userInfo.sub,
                    },
                },
            });

            const conversionsAndEarnings = await prisma.rewardful_conversion.aggregate({
                _count: true,
                _sum: {
                    commission_amount: true,
                },
                where: {
                    affiliate_account: {
                        userId: userInfo.sub,
                    },
                },
            });

            const totalConversions = conversionsAndEarnings._count;
            const totalEarnings = conversionsAndEarnings._sum.commissionAmount || 0;

            const averageEarningsPerConversion = totalConversions > 0 ? totalEarnings / totalConversions : 0;

            const clickThroughRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

            return {
                totalReferrals,
                totalConversions,
                clickThroughRate,
                totalEarnings,
                averageEarningsPerConversion,
            };
        },
        conversionDetails: async (_, { affiliate_account_id }, { prisma, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const affiliateAccount = await prisma.rewardful_affiliate_account.findUnique({
                where: { id: parseInt(affiliate_account_id) },
            });

            console.log('affiliate_account_id: ', affiliate_account_id)
            console.log('affiliate account is: ', affiliateAccount)

            if (!affiliateAccount || affiliateAccount.userId !== userInfo.sub) {
                throw new Error("Affiliate account not found or access denied");
            }

            console.log('user id is: ', userInfo.sub)

            const conversions = await prisma.rewardful_conversion.findMany({
                where: { affiliate_account_id: parseInt(affiliate_account_id) },
                orderBy: { createdAt: 'desc' },
            });

            return conversions.map((conversion) => ({
                id: conversion.id,
                product: conversion.product,
                amount: conversion.sale_amount,
                timestamp: conversion.createdAt,
                customer_identifier: conversion.customer_identifier,
                discount_applied: conversion.discount_applied,
                location: conversion.location,
            }))
        },
        getAffiliateMonthlySummaries: async (_, { affiliate_id }, { prisma, userInfo }) => {
            try {
                const response = await fetch(`https://api.getrewardful.com/v1/affiliates/${affiliate_id}/monthly_summaries`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.REWARDFUL_API_SECRET}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Rewardful API responded with status ${response.status}`);
                }

                const data = await response.json();

                console.log('affiliate monthly summary : ', data)

                return data.map(item => ({
                    month: item.month,
                    visitors: item.visitors,
                    leads: item.leads,
                    conversions: item.conversions,
                    sales: item.sales,
                    commissions: item.commissions,
                    netRevenue: item.netRevenue
                }));

            } catch (error) {
                console.error("Error fetching monthly summaries from Rewardful:", error);
                throw new Error("Failed to fetch monthly summaries");
            }
        },
    },
    Mutation: {
        createAffiliateAccount: async (_, { first_name, last_name, paypal_email, promotional_channels, is_customer_referrer}, { userInfo, prisma }) => {

            if (!userInfo) throw new Error("Authentication required");

            const body = {
                first_name,
                last_name,
                paypal_email,
                email: userInfo.email,
                user_id: userInfo.sub,
                stripe_customer_id: userInfo.stripe_customer_id
            };

            const rewardfulResponse = await createRewardfulAffiliate(body, prisma, is_customer_referrer);

            if (rewardfulResponse.success) {
                return {
                    success: true,
                    message: "Affiliate account created successfully.",
                    affiliate_account: rewardfulResponse.affiliateAccount,
                };
            } else {
                return {
                    success: false,
                    message: rewardfulResponse.message,
                };
            }
        },
        updateAffiliate: async (_, { email, firstName, lastName }, { userInfo, prisma }) => {
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
                    data: { email, first_name: firstName, last_name: lastName},
                });

                if (!updatedAffiliate) {
                    throw new Error("Failed to update affiliate details.");
                }

                return { success: true, message: "Affiliate details updated successfully", affiliate: updatedAffiliate };

            } catch (error) {
                console.log('[ERROR][updateAffiliateDetails][CATCH]: ', error)
                throw new GraphQLError('Unable to fetch affiliate payouts for that user.')
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
        generateReferralLink: async (_, { affiliate_id, code }, { prisma }) => {
            const affiliate = await prisma.rewardful_affiliate.findUnique({
                where: { id: parseInt(affiliate_id) },
            });

            if (!affiliate) {
                throw new Error("Affiliate not found");
            }

            const rewardfulBaseUrl = "https://api.getrewardful.com/v1/affiliate_links";
            const payload = {
                affiliate_id: affiliate.rewardful_id,
                token: code
            };

            try {
                const response = await fetch(rewardfulBaseUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.REWARDFUL_API_SECRET}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(`Failed to create referral link in Rewardful: ${data.message || response.status}`);
                }

                const newLink = await prisma.rewardful_referral_link.create({
                    data: {
                        affiliate_account_id: affiliate.id, // TODO: check this is the correct id needed
                        link: data.link,
                        visitors: 0,
                        leads: 0,
                        conversions: 0,
                    },
                });

                return {
                    success: true,
                    message: "Referral link generated successfully.",
                    link: {
                        id: newLink.id.toString(),
                        affiliate_account_id: newLink.affiliate_account_id.toString(),
                        link: newLink.link,
                        visitors: newLink.visitors,
                        leads: newLink.leads,
                        conversions: newLink.conversions,
                    },
                };
            } catch (error) {
                console.error("Error creating referral link:", error);
                return {
                    success: false,
                    message: error.message || "Failed to generate referral link",
                    link: null,
                };
            }
        },

    }
}

const createRewardfulAffiliate = async (userInfo, prisma, is_customer_referrer = false) => {
    const rewardfulBaseUrl = "https://api.getrewardful.com/v1/affiliates";

    const payload = {
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        token: userInfo.username,
        // campaign_id : ""
        paypal_email: userInfo.paypal_email,
        receive_new_commission_notifications: false
    };

    if (is_customer_referrer) {
        payload.stripe_customer_id = userInfo.stripe_customer_id;
    }

    try {
        const response = await fetch(rewardfulBaseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.REWARDFUL_API_SECRET}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to create affiliate account in Rewardful.");


        const affiliate = await prisma.rewardful_affiliate.upsert({
            where: { email: data.email },
            update: {
                paypal_email: data.paypal_email,
                rewardful_id: data.id,
                first_name: data.first_name,
                last_name: data.last_name,
            },
            create: {
                user_id: userInfo.user_id,
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                paypal_email: data.paypal_email,
                rewardful_id: data.id,
            },
        });

        const affiliateAccount = await prisma.rewardful_affiliate_account.create({
            data: {
                userId: userInfo.user_id,
                affiliate_id: affiliate.rewardful_id,
                status: data.state,
                promotional_channels: JSON.stringify(userInfo.promotional_channels || []),
                referral_links: {
                    create: data.links.map(link => ({
                        link: link.url,
                        visitors: 0,
                        conversions: 0,
                        leads: 0
                    })),
                },
            },
        });

        const commissionStats = data.commission_stats?.currencies || {};
        Object.keys(commissionStats).forEach(async (currency) => {

            const totalAmount = calculateTotalAmount(commissionStats[currency]);
            await prisma.rewardful_commission_stats.upsert({
                where: {
                    affiliate_account_id_currency: {
                        affiliate_account_id: affiliateAccount.id,
                        currency: currency,
                    },
                },
                update: {
                    amount: totalAmount,
                },
                create: {
                    affiliate_account_id: affiliateAccount.id,
                    currency: currency,
                    amount: totalAmount,
                },
            });
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

const calculateCTR = (totalReferrals, successfulConversions) => {
    if (totalReferrals === 0) return 0;
    return (successfulConversions / totalReferrals) * 100;
}

const calculateTotalAmount = (commissionStats) => {
    const grossRevenue = commissionStats.gross_revenue.cents / 100;
    const netRevenue = commissionStats.net_revenue.cents / 100;

    return grossRevenue + netRevenue;
}

export default resolvers