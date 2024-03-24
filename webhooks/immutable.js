export const immutableWebHook = async (req,res) => {
    console.log('Received Immutable Webhook:', req.body);

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
    console.log('Handling NFT Order Created Event: ', data)
}

const handleNftUpdated = (data) => {
    console.log('Handling NFT Updated Event: ', data)
}

const handleNftCreated = (data) => {
    console.log('Handling NFT Created Event: ', data)
}

function handleTransferCreated(data) {
    console.log('Handling Transfer Created Event:', data);
}

function handleTransferUpdated(data) {
    console.log('Handling Transfer Updated Event:', data);
}

function handleNewListing(data) {
    console.log('Handling New Listing Event:', data);
}