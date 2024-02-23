import {prisma} from "../src/services.js";

export const rewardfulWebHook = async (req, res) => {
    if (!verifySignature(req, process.env.REWARDFUL_SIGNING_SECRET)) {
        return res.status(401).send('Signature verification failed');
    }

    const event = req.body;

    try {
        switch (event.type) {
            case 'affiliate.created':
                await handleAffiliateCreated(event.data);
                break;
            case 'referral.created':
                await handleReferralCreated(event.data);
                break;
            case 'conversion.completed':
                await handleConversionCompleted(event.data);
                break;
            case 'payout.updated':
                await handlePayoutUpdated(event.data);
                break;
            case 'payout.failed':
                await handlePayoutFailed(event.data);
                break;
            case 'referral.updated':
                await handleReferralUpdated(event.data);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error(`Error handling ${event.type}:`, error);
        return res.status(500).send('Internal Server Error');
    }

    res.status(200).send('Event processed');
}

function verifySignature(req, secret) {
    const signature = req.headers['rewardful-signature'];
    if (!signature) return false;

    const body = JSON.stringify(req.body);
    const timestamp = signature.split(',')[0].split('=')[1];
    const receivedSignature = signature.split(',')[1].split('=')[1];

    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = crypto.createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(receivedSignature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

async function handleReferralCreated(data) {
    await prisma.rewardful_affiliate_referral.create({
        data: {
            affiliate_id: data.affiliate_id,
            referral_code: data.referral_code,
            referred_user: data.referred_user,
            commission_earned: data.commission_earned ? data.commission_earned : 0,
            status: "Pending",
        },
    });
    console.log('Referral created successfully');
}

async function handleConversionCompleted(data) {
    await prisma.rewardful_affiliate_referral.updateMany({
        where: { referral_code: data.referral_code },
        data: { status: "Completed", commission_earned: data.commission_amount },
    });
    console.log('Conversion completed successfully');
}

async function handlePayoutUpdated(data) {
    await prisma.rewardful_payout.create({
        data: {
            affiliate_account_id: data.affiliate_account_id,
            amount: data.amount,
            status: data.status,
            payout_date: new Date(data.payout_date),
        },
    });
    console.log('Payout updated successfully');
}

async function handleAffiliateCreated(data) {
    try {
        const affiliate = await prisma.rewardful_affiliate.create({
            data: {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                rewardful_id: data.id,
            },
        });
        console.log('Affiliate created successfully:', affiliate);
    } catch (error) {
        console.error('Error creating affiliate in database:', error);
        throw error;
    }
}


async function handlePayoutFailed(data) {
    try {
        const payout = await prisma.rewardful_payout.updateMany({
            where: { id: data.payout_id },
            data: { status: 'failed' },
        });
        console.log('Payout status updated to failed for:', payout);
        // Optionally, send a notification about the failed payout here
    } catch (error) {
        console.error('Error updating payout status in database:', error);
        throw error;
    }
}

async function handleReferralUpdated(data) {
    try {
        const referral = await prisma.rewardful_affiliate_referral.update({
            where: { referral_code: data.referral_code },
            data: {
                commission_earned: data.commission_earned,
                status: data.status,
                // Update additional fields as necessary
            },
        });
        console.log('Referral updated successfully:', referral);
    } catch (error) {
        console.error('Error updating referral in database:', error);
        throw error;
    }
}
