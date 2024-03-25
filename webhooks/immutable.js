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

const handleNftCreated = async (eventData) => {
    // Prepare mint data from events
    const mintsData = eventData.map(event => {
      const { transaction_id, user, timestamp } = event.data;
      const token_id = event.data.token.data.token_id;
  
      return {
        id: BigInt(transaction_id),
        user: user, 
        timestamp: timestamp,
        token_id: BigInt(token_id),
      };
    });
  
    try {
      const result = await prisma.mints.createMany({
        data: mintsData,
        skipDuplicates: true,
      });
  
      console.log(`${result.count} mints inserted.`);
    } catch (error) {
      console.error('Error inserting mint data:', error);
    }
  };
  
  const handleTransferCreated = async (eventData) => {
    const transfersData = eventData.map(event => {
      const { transaction_id, user, receiver, timestamp } = event.data;
      const token_id = event.data.token.data.token_id;
  
      return {
        id: BigInt(transaction_id),
        from_user: user,
        to_user: receiver,
        timestamp: timestamp, 
        token_id: BigInt(token_id),
      };
    });
  
    try {
      const result = await prisma.transfers.createMany({
        data: transfersData,
        skipDuplicates: true,
      });
  
      console.log(`${result.count} transfers inserted.`);
    } catch (error) {
      console.error('Error inserting transfer data:', error);
    }
  };