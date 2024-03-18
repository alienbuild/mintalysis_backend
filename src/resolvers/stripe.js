import Stripe from "stripe";
import {GraphQLError} from "graphql";
import {getFeaturesForPriceId, validatePriceId} from "../../webhooks/stripe.js";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

const resolvers = {
    Query: {
        currentUserSubscription: async (_, __, { prisma, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }
            return await prisma.user.findUnique({
                where: {id: userInfo.sub},
                include: {
                    subscription: true,
                },
            });
        },
        subscriptionPlans: async (_, __, { prisma }) => {
            return await prisma.subscription_plan.findMany({
                include: {
                    prices: true,
                },
            });
        },
        userHasFeatureAccess: async (_, { feature }, { prisma, userInfo }) => {
            if (!userInfo) {
                return {
                    hasAccess: false,
                    message: "User is not authenticated",
                };
            }

            // Retrieve user's subscription plan
            const userWithSubscription = await prisma.user.findUnique({
                where: { id: userInfo.sub },
                include: {
                    subscription: {
                        include: {
                            subscription_plan: true,
                        },
                    },
                },
            });

            if (!userWithSubscription || !userWithSubscription.subscription || !userWithSubscription.subscription.subscription_plan) {
                return {
                    hasAccess: false,
                    message: "No subscription plan found",
                };
            }

            const features = userWithSubscription.subscription.subscription_plan.features;
            const hasAccess = features && features.includes(feature);

            return {
                hasAccess,
                message: hasAccess ? "Access granted" : "Access denied",
            };
        },
        fetchAccessRights: async (_, args, { prisma, userInfo }) => {
            if (!userInfo) {
                return {
                    success: false,
                    message: "Authentication required",
                    rights: [],
                };
            }

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
                include: {
                    subscription: {
                        include: {
                            subscription_plan: true
                        }
                    }
                }
            });

            if (!user || !user.subscription) {
                return {
                    success: true,
                    message: "No subscription found",
                    rights: [],
                };
            }

            // Example to fetch rights based on subscription
            // You'll need to adjust this based on how you store/manage access rights
            const rights = user.subscription && user.subscription.subscription_plan
                ? [
                    {
                        featureKey: "createServer",
                        hasAccess: user.subscription.subscription_plan.features.includes("createServer"),
                    },
                ]
                : [];

            return {
                success: true,
                message: "Access rights fetched successfully",
                rights,
            };
        },
        featureFlags: async (_, __, { prisma }) => {
            return await prisma.feature_flag.findMany({
                where: { enabled: true },
            });
        },
        userFeatureUsage: async (_, { feature_flag_id }, { prisma, userInfo }) => {
            return await prisma.userFeatureUsage.findFirst({
                where: {
                    userId: userInfo.sub,
                    feature_flag_id: parseInt(feature_flag_id),
                },
            });
        },
    },
    Mutation: {
        createCheckoutSession: async (_, { priceId }, { userInfo }) => {
            if (!userInfo) {
                return {
                    success: false,
                    message: "Authentication required",
                    sessionUrl: null,
                };
            }

            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price: priceId,
                        quantity: 1,
                    }],
                    mode: 'subscription',
                    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/`,
                });

                return {
                    success: true,
                    message: "Checkout session created successfully",
                    sessionUrl: session.url,
                };
            } catch (error) {
                console.error('Error creating checkout session:', error);
                return {
                    success: false,
                    message: "Failed to create checkout session",
                    sessionUrl: null,
                };
            }
        },
        createSubscription: async (_, { stripeToken, priceId }, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const isValidPriceId = await validatePriceId(priceId);
            if (!isValidPriceId) throw new Error("Invalid price ID");

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_customer_id) {
                // Create a new Stripe customer
                const customer = await stripe.customers.create({
                    email: user.email,
                    source: stripeToken,
                });

                // Save the customer ID in your database
                await prisma.user.update({
                    where: { id: userInfo.sub },
                    data: { stripe_customer_id: customer.id },
                });
            }

            // Create the subscription
            const subscription = await stripe.subscriptions.create({
                customer: user.stripe_customer_id,
                items: [{ price: priceId }],
            });

            const features = getFeaturesForPriceId(priceId);

            const subscriptionRecord = await prisma.subscription.create({
                data: {
                    id: subscription.id,
                    user_id: userInfo.sub,
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000),
                    current_period_end: new Date(subscription.current_period_end * 1000),
                },
            });

            // Update the user record with subscription details
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: {
                    stripe_subscription_id: subscription.id,
                    subscription_status: subscription.status,
                    features,
                },
            });

            return {
                success: true,
                message: "Subscription created successfully",
                subscription: subscriptionRecord,
            };
        },
        cancelSubscription: async (_, __, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_subscription_id) {
                throw new Error("No subscription found");
            }

            // Cancel the subscription
            await stripe.subscriptions.del(user.stripe_subscription_id);

            // Update the user's subscription status
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: { subscription_status: 'canceled' },
            });

            return {
                success: true,
                message: "Subscription canceled successfully",
                user: await prisma.user.findUnique({ where: { id: userInfo.sub } }),
            };
        },
        changeSubscriptionPlan: async (_, { newPriceId }, { prisma, stripe, userInfo }) => {
            if (!userInfo) {
                throw new Error("Authentication required");
            }

            const isValidPriceId = await validatePriceId(newPriceId);
            if (!isValidPriceId) throw new Error("Invalid price ID");

            const user = await prisma.user.findUnique({
                where: { id: userInfo.sub },
            });

            if (!user.stripe_subscription_id) {
                throw new Error("No subscription found to update");
            }

            // Retrieve the current subscription
            const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

            // Update the subscription to the new plan
            const updatedSubscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId,
                }],
            });

            // Update user's subscription status (optional)
            await prisma.user.update({
                where: { id: userInfo.sub },
                data: { subscription_status: updatedSubscription.status },
            });

            return {
                success: true,
                message: "Subscription plan changed successfully",
                user: await prisma.user.findUnique({ where: { id: userInfo.sub } }),
            };
        },
        verifyStripeSession: async (_, { sessionId }, { prisma, userInfo }) => {
            if (!userInfo) throw new GraphQLError('Not authorised')
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId);
                if (session.payment_status === 'paid') {
                    // Verify the session and update the user's subscription status
                    const user = await prisma.user.update({
                        where: { stripe_customer_id: session.customer },
                        data: { subscription_status: 'ACTIVE' },
                    });
                    return {
                        success: true,
                        message: 'Subscription verified and activated.',
                        user,
                    };
                }
                return {
                    success: false,
                    message: 'Subscription verification failed or payment not completed.',
                    user: null,
                };
            } catch (error) {
                console.error('Error verifying Stripe session:', error);
                return {
                    success: false,
                    message: 'Internal server error during verification.',
                    user: null,
                };
            }
        },
        updateUserFeatureUsage: async (_, { feature_flag_id, count }, { userInfo, prisma }) => {
            const existingUsage = await prisma.user_feature_usage.findFirst({
                where: {
                    userId: userInfo.sub,
                    feature_flag_id: parseInt(feature_flag_id),
                },
            });

            const featureFlag = await prisma.feature_flag.findUnique({
                where: { id: parseInt(feature_flag_id) },
            });

            if (existingUsage && featureFlag.usage_limit) {
                if (existingUsage.usageCount + count > featureFlag.usage_limit) {
                    throw new Error("Usage limit exceeded for the feature");
                }
            }

            return await prisma.userFeatureUsage.upsert({
                where: {
                    userId_feature_flag_id: {
                        userId: userInfo.sub,
                        feature_flag_id: parseInt(feature_flag_id),
                    },
                },
                update: {
                    usageCount: existingUsage ? existingUsage.usageCount + count : count,
                },
                create: {
                    userId: userInfo.sub,
                    feature_flag_id: parseInt(feature_flag_id),
                    usageCount: count,
                },
            });
        },
    },
}

export default resolvers
