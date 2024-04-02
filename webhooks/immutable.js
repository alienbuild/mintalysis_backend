import {prisma} from "../src/services.js";

export const immutableWebHook = async (req, res) => {
    const { Type, Message } = req.body;
    if (Type === 'Notification') {
        let eventData;
        try {
            eventData = JSON.parse(Message);
        } catch (error) {
            console.error('Error parsing event message:', error);
            return res.status(400).send('Bad Request: Invalid JSON');
        }

        const { event_name } = eventData;
        try {
            switch (event_name) {
                case 'imtbl_x_nft_created':
                    await handleNftCreated(eventData);
                    break;
                case 'imtbl_x_nft_updated':
                    // await handleNftUpdated(eventData);
                    break;
                case 'imtbl_x_order_accepted':
                    // await handleOrderCreated(eventData);
                    break;
                case 'imtbl_x_transfer_created':
                    await handleTransferCreated(eventData);
                    break;
                default:
                    console.warn('Unhandled event type:', event_name);
            }
            res.status(200).send('Event processed');
        } catch (error) {
            console.error('Error handling event:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('Invalid event type');
    }
};


// const handleOrderCreated = (data) => {
//     // NOT SEEN THIS EVENT USED YET PERSONALLY
//     console.log('[EVENT][NFT ORDER CREATED]: ', JSON.stringify(data, null, 2))
// }

// const handleNftUpdated = (data) => {
//     console.log('[EVENT][NFT UPDATED EVENT]: ', JSON.stringify(data, null, 2))
// }

const handleNftCreated = async (eventData) => {
    try {
        const { transaction_id, user, timestamp } = eventData.data;
        const token_id = eventData.data.token.data.token_id;

        const mintData = {
            id: transaction_id,
            user: user,
            timestamp: timestamp,
            token_id: token_id
        };

        await prisma.mints.create({
            data: mintData,
        });

    } catch (error) {
        console.error('Error inserting mint data:', error);
    }
};

const handleTransferCreated = async (eventData) => {
    try {
        const { transaction_id, user, receiver, timestamp } = eventData.data;
        const token_id = eventData.data.token.data.token_id;

        const transferData = {
            id: transaction_id,
            from_user: user,
            to_user: receiver,
            timestamp: timestamp,
            token_id: token_id
        };

        await prisma.transfers.create({
            data: transferData,
        });

    } catch (error) {
        console.error('Error inserting transfer data:', error);
    }
};