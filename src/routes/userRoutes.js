import express from 'express';
import {pubsub} from "../services.js";

const router = express.Router();

router.post('/update-user-status', async (req, res) => {
    try {
        const { userId, newStatus } = req.body;

        await pubsub.publish('USER_STATUS_CHANGED', {
            userStatusChanged: {
                id: userId,
                status: newStatus,
            }
        });

        res.status(200).send('User status updated and notification sent');
    } catch (error) {
        console.error('Failed to update user status:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
