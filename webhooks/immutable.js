export const immutableWebHook = async (req,res) => {
    console.log('Received Immutable Webhook:', req.body);

    const { Type, SubscribeURL } = req.body;
    if (Type === 'SubscriptionConfirmation') {
        console.log('Confirming subscription at:', SubscribeURL);

        try {
            const response = await fetch(SubscribeURL);
            if (response.ok) {
                const data = await response.text();
                console.log('Subscription confirmed:', data);
                res.status(200).send('Subscription confirmed');
            } else {
                throw new Error('Subscription confirmation failed with status ' + response.status);
            }
        } catch (error) {
            console.error('Error confirming subscription:', error);
            res.status(500).send('Failed to confirm subscription');
        }
    } else {
        res.status(200).send('OK');
    }
}