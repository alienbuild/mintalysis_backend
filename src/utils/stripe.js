import stripe from 'stripe';
import {prisma} from "../services.js";

const stripeInstance = stripe(process.env.STRIPE_TEST_SECRET_KEY);

const priceIdToFeatures = {
    'price_123': {
        canAccessPremiumContent: true,
        canUseAdvancedFeatures: false,
        additionalFeature: false,
    },
    'price_456': {
        canAccessPremiumContent: true,
        canUseAdvancedFeatures: true,
        additionalFeature: true,
    },
};

export const getFeaturesForPriceId = (priceId) => {
    return priceIdToFeatures[priceId] || {
        canAccessPremiumContent: false,
        canUseAdvancedFeatures: false,
        additionalFeature: false,
    };
};

export const validateStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const dataObject = event.data.object;

    // Handle the event
    try {
        switch (event.type) {
            case 'invoice.paid':
                console.log(`Invoice with ID ${dataObject.id} was paid.`);
                await handleInvoicePaid(dataObject)
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(dataObject)
                console.log(`Subscription with ID ${dataObject.id} was created for customer ${dataObject.customer}.`);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(dataObject)
                console.log(`Subscription with ID ${dataObject.id} was updated.`);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(dataObject)
                console.log(`Subscription with ID ${dataObject.id} was deleted.`);
                break;
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(dataObject);
                console.log(`Checkout session with ID ${dataObject.id} was completed successfully.`);
                break;
            default:
                return res.status(400).send(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error(`Error handling event type ${event.type}: ${error}`);
    }

    res.json({received: true});
};

async function getUserIdByStripeCustomerId(stripeCustomerId) {
    const user = await prisma.user.findUnique({
        where: {
            stripe_customer_id: stripeCustomerId,
        },
        select: {
            id: true,
        },
    });

    return user ? user.id : null;
}

async function handleInvoicePaid(dataObject) {

    try {
        const user_id = await getUserIdByStripeCustomerId(dataObject.customer);

        if (!user_id) {
            console.error(`User not found for Stripe customer ID: ${dataObject.customer}`);
            return;
        }

        const payment = await prisma.payment.create({
            data: {
                invoice_id: dataObject.id,
                user_id,
                amount: dataObject.amount_paid / 100,
                currency: dataObject.currency,
                paid_at: new Date(dataObject.created * 1000),
            },
        });

        console.log(`Payment recorded: ${payment.id}`);
    } catch (err) {
        console.error(`Error handling invoice.paid event: ${err}`);
    }

}

async function handleSubscriptionCreated(dataObject) {
    try {
        const userId = await getUserIdByStripeCustomerId(dataObject.customer);

        if (!userId) {
            console.error(`User not found for Stripe customer ID: ${dataObject.customer}`);
            return;
        }

        // Assuming you have a way to map Stripe's price ID to your subscription_price records
        const priceId = dataObject.items.data[0].price.id;
        const subscriptionPrice = await prisma.subscription_price.findFirst({
            where: { stripe_price_id: priceId },
        });

        if (!subscriptionPrice) {
            console.error(`Subscription price not found for Stripe price ID: ${priceId}`);
            return;
        }

        await prisma.subscription.upsert({
            where: { stripe_subscription_id: dataObject.id },
            update: {
                status: dataObject.status,
                current_period_start: new Date(dataObject.current_period_start * 1000),
                current_period_end: new Date(dataObject.current_period_end * 1000),
            },
            create: {
                id: dataObject.id,
                user_id: userId,
                stripe_subscription_id: dataObject.id,
                status: dataObject.status,
                current_period_start: new Date(dataObject.current_period_start * 1000),
                current_period_end: new Date(dataObject.current_period_end * 1000),
            },
        });

        console.log(`Subscription details updated for user: ${userId}`);
    } catch (err) {
        console.error(`Error handling customer.subscription.created event: ${err}`);
    }
}

async function handleSubscriptionUpdated(dataObject) {
    const user_id = await getUserIdByStripeCustomerId(dataObject.customer);

    if (!user_id) {
        console.error(`User not found for Stripe customer ID: ${dataObject.customer}`);
        return;
    }

    const status = dataObject.status;
    const currentPeriodStart = new Date(dataObject.current_period_start * 1000);
    const currentPeriodEnd = new Date(dataObject.current_period_end * 1000);
    const newPriceId = dataObject.items.data[0].price.id; // Assuming the subscription has a single item

    const newPrice = await prisma.subscription_price.findUnique({
        where: {
            stripe_price_id: newPriceId,
        },
    });

    if (!newPrice) {
        console.error(`Subscription price not found for Stripe price ID: ${newPriceId}`);
        return;
    }

    // Update the subscription record in your database
    await prisma.subscription.update({
        where: {
            stripe_subscription_id: dataObject.id,
        },
        data: {
            status: status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            plan_id: newPrice.plan_id,
        },
    });

    console.log(`Subscription updated for user: ${user_id}. Plan changed to price ID: ${newPriceId}`);
}

async function handleSubscriptionDeleted(dataObject) {
    const userId = await getUserIdByStripeCustomerId(dataObject.customer);

    if (!userId) {
        console.error(`User not found for Stripe customer ID: ${dataObject.customer}`);
        return;
    }

    await prisma.subscription.updateMany({
        where: {
            user_id: userId,
            stripe_subscription_id: dataObject.id,
        },
        data: {
            status: 'canceled',
            current_period_end: new Date(dataObject.canceled_at * 1000), // or dataObject.ended_at depending on your Stripe plan configuration
        },
    });

    await prisma.user.update({
        where: { id: userId },
        data: {
            subscription_status: 'canceled',
        },
    });

    console.log(`Subscription with ID ${dataObject.id} for user ${userId} has been canceled.`);
}

async function handleCheckoutSessionCompleted(dataObject) {

    const userId = await getUserIdByStripeCustomerId(dataObject.customer);

    if (!userId) {
        console.error(`User ID not found in checkout session metadata.`);
        return;
    }

    // Retrieve subscription details included in the checkout session
    const { subscription } = dataObject;

    if (!subscription) {
        console.error(`Subscription ID not found in checkout session.`);
        return;
    }

    // Retrieve the subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);

    // Assuming you have a way to map Stripe's price ID to your internal records
    const priceId = stripeSubscription.items.data[0].price.id;
    const subscriptionPrice = await prisma.subscription_price.findFirst({
        where: { stripe_price_id: priceId },
    });

    if (!subscriptionPrice) {
        console.error(`Subscription price not found for Stripe price ID: ${priceId}`);
        return;
    }

    const subscriptionPlan = await prisma.subscription_plan.findUnique({
        where: { id: subscriptionPrice.plan_id },
    });

    if (!subscriptionPlan) {
        console.error(`Subscription plan not found for plan ID: ${subscriptionPrice.plan_id}`);
        return;
    }

    await prisma.subscription.upsert({
        where: { stripe_subscription_id: stripeSubscription.id },
        update: {
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000),
            plan_id: subscriptionPlan.id,
        },
        create: {
            user_id: userId,
            stripe_subscription_id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000),
            plan_id: subscriptionPlan.id,
        },
    });

    console.log(`Checkout session for user ${userId} completed successfully.`);
}

export const validatePriceId = async (priceId) => {
    const priceRecord = await prisma.subscription_price.findUnique({
        where: { stripe_price_id: priceId },
    });
    return priceRecord !== null;
};