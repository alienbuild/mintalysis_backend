import {prisma} from "../src/services.js";

const eventHandlers = {
    'imtbl_x_nft_created': handleNftCreated,
    // 'imtbl_x_nft_updated': handleNftUpdated,
    // 'imtbl_x_order_accepted': handleOrderCreated,
    'imtbl_x_transfer_created': handleTransferCreated,
};

import { eventHandlers } from './eventHandlers'; // Ensure this is correctly imported

// Handler for Immutable webhook notifications
export const immutableWebHook = async (req, res) => {
    const { Type, Message } = req.body;

    // Early return for non-notification types
    if (Type !== 'Notification') {
        return res.status(400).send('Expected a Notification type');
    }

    // Attempt to parse the JSON message
    let eventData;
    try {
        eventData = JSON.parse(Message);
    } catch (error) {
        console.error('Error parsing event message:', error);
        return res.status(400).send('Bad Request: Invalid JSON');
    }

    // Validate the structure of eventData
    if (!eventData || !eventData.data) {
        console.error('Invalid eventData structure:', eventData);
        return res.status(400).send('Invalid event data');
    }
    console.log('Incoming eventData:', JSON.stringify(eventData, null, 2));

    // Check if the token address matches the expected value
    const expectedTokenAddress = "0xa7aefead2f25972d80516628417ac46b3f2604af";
    // transfer and mint structures
    const tokenAddress = eventData.data.token?.data?.token_address || eventData.data.token_address;
    if (tokenAddress !== expectedTokenAddress) {
        return res.status(200).send('Event token address does not match the expected value.');
    }

    // Process the event based on its name
    const { event_name } = eventData;
    const handler = eventHandlers[event_name];
    if (handler) {
        try {
            await handler(eventData);
            res.status(200).send('Event processed');
        } catch (error) {
            console.error('Error handling event:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        console.warn('Unhandled event type:', event_name);
        res.status(200).send('Unhandled event type');
    }
};



// const isValidTokenAddress = (eventData) => {
//     return eventData.data.token.data.token_address === "0xa7aefead2f25972d80516628417ac46b3f2604af";
// };
// const handleOrderCreated = (data) => {
//     // NOT SEEN THIS EVENT USED YET PERSONALLY
//     console.log('[EVENT][NFT ORDER CREATED]: ', JSON.stringify(data, null, 2))
// }

// const handleNftUpdated = (data) => {
//     console.log('[EVENT][NFT UPDATED EVENT]: ', JSON.stringify(data, null, 2))
// }

async function handleNftCreated(eventData) {
    console.log("eventData: ", eventData);
    try {
            const { transaction_id, user, timestamp } = eventData.data;
            const token_id = eventData.data.token.data.token_id;

            const mintData = {
                id: BigInt(transaction_id), 
                user: user,
                timestamp: timestamp,
                token_id: BigInt(token_id)
            };
        console.log("mintData: ", mintData);

        await prisma.mints.create({
            data: mintData,
        });

    } catch (error) {
        console.error('Error inserting mint data:', error);
    } 
};

async function handleTransferCreated(eventData) {
    console.log("eventData: ", eventData);
    try {
        const { transaction_id, user, receiver, timestamp } = eventData.data;
        const token_id = eventData.data.token.data.token_id;

        const transferData = {
            id: BigInt(transaction_id),
            from_user: user,
            to_user: receiver,
            timestamp: timestamp,
            token_id: BigInt(token_id)
        };
        console.log("transferData: ", transferData);
        await prisma.transfers.create({
            data: transferData,
        });

    } catch (error) {
        console.error('Error inserting transfer data:', error);
    } 
};