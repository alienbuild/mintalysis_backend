import Stripe from "stripe";
import {getFeaturesForPriceId, validatePriceId} from "../utils/stripe.js";

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
    }
}

export default resolvers
