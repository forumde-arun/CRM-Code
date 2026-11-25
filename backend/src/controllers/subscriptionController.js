
import {
  getSubscriptionSummary,
} from '../services/subscriptionService.js';

/**
 * GET /api/subscription/me
 *
 * Get the logged-in user's subscription details.
 * Creates the free trial if the user has no subscription.
 */
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const subscription = await getSubscriptionSummary(userId);

    return res.status(200).json({
      success: true,
      message: 'Subscription details retrieved successfully.',
      data: subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve subscription details.',
    });
  }
};

export default {
  getMySubscription,
};

