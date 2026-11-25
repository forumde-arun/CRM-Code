
import { SUBSCRIPTION_CONFIG } from '../config/subscription.js';

/**
 * Return available subscription plans.
 *
 * Prices are stored in paise in the configuration
 * and converted to rupees for frontend display.
 *
 * Razorpay Plan IDs are never exposed to the frontend.
 */
export const getAvailablePlans = () => {
  const { plans, billing } = SUBSCRIPTION_CONFIG;

  return Object.entries(plans)
    .filter(([, plan]) => plan.enabled)
    .map(([code, plan]) => ({
      code,
      name: plan.name,
      messageLimit: plan.messageLimit,

      currency: billing.currency,

      pricing: {
        monthly: {
          amount: plan.monthlyPricePaise,
          displayAmount: plan.monthlyPricePaise / 100,
          billingCycle: 'monthly',
        },

        yearly: {
          amount: plan.yearlyPricePaise,
          displayAmount: plan.yearlyPricePaise / 100,
          billingCycle: 'yearly',
        },
      },

      quotaDescription: `${plan.messageLimit.toLocaleString('en-IN')} messages per month`,
    }));
};

/**
 * Find a specific enabled plan.
 */
export const getPlanByCode = (planCode) => {
  if (!planCode || typeof planCode !== 'string') {
    return null;
  }

  const normalizedCode = planCode.trim().toLowerCase();

  const plan = SUBSCRIPTION_CONFIG.plans[normalizedCode];

  if (!plan || !plan.enabled) {
    return null;
  }

  return {
    code: normalizedCode,
    ...plan,
  };
};

/**
 * Validate a billing cycle.
 */
export const isSupportedBillingCycle = (billingCycle) => {
  return SUBSCRIPTION_CONFIG.billing.supportedCycles.includes(
    billingCycle
  );
};

export default {
  getAvailablePlans,
  getPlanByCode,
  isSupportedBillingCycle,
};

