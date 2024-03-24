export const immutableWebHook = async (req,res) => {
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
        switch (event_name) {
            case 'imtbl_x_nft_created':
                handleNftCreated(eventData)
                break
            case 'imtbl_x_nft_updated':
                handleNftUpdated(eventData)
                break
            case 'imtbl_x_order_accepted':
                handleOrderCreated(eventData)
                break
            case 'imtbl_x_transfer_created':
                handleTransferCreated(eventData);
                break;
            case 'imtbl_x_transfer_updated':
                handleTransferUpdated(eventData);
                break;
            case 'imtbl_x_new_listing':
                handleNewListing(eventData);
                break;
            // Add more cases as needed for other event types
            default:
                console.warn('Unhandled event type:', event_name);
        }
    }

    res.status(200).send('Event processed');
}

const handleOrderCreated = (data) => {
    console.log('[EVENT][NFT ORDER CREATED]: ', JSON.stringify(data, null, 2))
}

const handleNftUpdated = (data) => {
    console.log('[EVENT][NFT UPDATED EVENT]: ', JSON.stringify(data, null, 2))
}

const handleNftCreated = (data) => {
    console.log('[EVENT][NFT CREATED EVENT]: ', JSON.stringify(data, null, 2))
}

function handleTransferCreated(data) {
    console.log('[EVENT][TRANSFER CREATED EVENT]:', JSON.stringify(data, null, 2));
}

function handleTransferUpdated(data) {
    console.log('[EVENT][TRANSFER UPDATED EVENT]:', JSON.stringify(data, null, 2));
}

function handleNewListing(data) {
    console.log('[EVENT][NEW LISTING EVENT]:', JSON.stringify(data, null, 2));
}