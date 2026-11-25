
import express from 'express';

import { getMySubscription } from '../controllers/subscriptionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get the logged-in user's subscription and message usage.
router.get('/me', auth, getMySubscription);

export default router;
