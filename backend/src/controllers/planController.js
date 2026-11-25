
import {
  getAvailablePlans,
} from '../services/planService.js';

import { SUBSCRIPTION_CONFIG } from '../config/subscription.js';

/**
 * GET /api/plans
 *
 * Public endpoint to retrieve available subscription plans.
 */
export const getPlans = async (req, res) => {
  try {
    const plans = getAvailablePlans();

    return res.status(200).json({
      success: true,
      message: 'Subscription plans retrieved successfully.',

      data: {
        currency: SUBSCRIPTION_CONFIG.billing.currency,

        trial: {
          enabled: SUBSCRIPTION_CONFIG.trial.enabled,
          messageLimit: SUBSCRIPTION_CONFIG.trial.messageLimit,
          expiresAfterDays: SUBSCRIPTION_CONFIG.trial.expiresAfterDays,
          expireWhenQuotaExhausted:
            SUBSCRIPTION_CONFIG.trial.expireWhenQuotaExhausted,
        },

        billing: {
          supportedCycles:
            SUBSCRIPTION_CONFIG.billing.supportedCycles,
          rolloverUnusedMessages:
            SUBSCRIPTION_CONFIG.billing.rolloverUnusedMessages,
          yearlyQuotaMode:
            SUBSCRIPTION_CONFIG.billing.yearlyQuotaMode,
        },

        plans,
      },
    });
  } catch (error) {
    console.error('Get plans error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve subscription plans.',
    });
  }
};

export default {
  getPlans,
};
