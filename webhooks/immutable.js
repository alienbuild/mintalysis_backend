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
                // NOT SEEN THIS EVENT USED YET PERSONALLY
                handleNftCreated(eventData)
                break
            case 'imtbl_x_nft_updated':
                handleNftUpdated(eventData)
                break
            case 'imtbl_x_order_accepted':
                // NOT SEEN THIS EVENT USED YET PERSONALLY
                handleOrderCreated(eventData)
                break
            case 'imtbl_x_transfer_created':
                handleTransferCreated(eventData);
                break;
            default:
                console.warn('Unhandled event type:', event_name);
        }
    }

    res.status(200).send('Event processed');
}

const handleOrderCreated = (data) => {
    // NOT SEEN THIS EVENT USED YET PERSONALLY
    console.log('[EVENT][NFT ORDER CREATED]: ', JSON.stringify(data, null, 2))
}

const handleNftUpdated = (data) => {
    console.log('[EVENT][NFT UPDATED EVENT]: ', JSON.stringify(data, null, 2))
}

const handleNftCreated = (data) => {
    // NOT SEEN THIS EVENT USED YET PERSONALLY
    console.log('[EVENT][NFT CREATED EVENT]: ', JSON.stringify(data, null, 2))
}

const handleTransferCreated = (data) => {
    console.log('[EVENT][TRANSFER CREATED EVENT]:', JSON.stringify(data, null, 2));
}
