
import express from 'express';

import { getPlans } from '../controllers/planController.js';

const router = express.Router();

// Public endpoint: retrieve available subscription plans.
router.get('/', getPlans);

export default router;
