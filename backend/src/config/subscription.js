
/**
 * CRM Subscription Configuration
 *
 * Central configuration for trial, billing, message usage,
 * subscription access, and paid plans.
 *
 * All prices are stored in paise.
 */

export const SUBSCRIPTION_CONFIG = {
  // --------------------------------------------------
  // FREE TRIAL
  // --------------------------------------------------
  trial: {
    enabled: true,
    messageLimit: 100,
    expiresAfterDays: null,
    expireWhenQuotaExhausted: true,
  },

  // --------------------------------------------------
  // BILLING
  // --------------------------------------------------
  billing: {
    provider: 'razorpay',
    supportedCycles: ['monthly', 'yearly'],
    currency: 'INR',
    rolloverUnusedMessages: false,
    yearlyQuotaMode: 'monthly',
    usageCounting: 'meta_accepted',
  },

  // --------------------------------------------------
  // MESSAGE USAGE
  // --------------------------------------------------
  usage: {
    reserveBeforeSending: true,
    releaseCreditsOnFailure: true,
    preventSendingWhenQuotaExhausted: true,
    preventConcurrentOveruse: true,
  },

  // --------------------------------------------------
  // SUBSCRIPTION ACCESS
  // --------------------------------------------------
  access: {
    allowDashboardWhenExpired: true,
    allowCampaignSendingWithoutActivePlan: false,
    retainAccessUntilPeriodEnd: true,
  },

  // --------------------------------------------------
  // DEMO PAID PLANS
  // --------------------------------------------------
  plans: {
    starter: {
      name: 'Starter',
      enabled: true,

      messageLimit: 1000,

      monthlyPricePaise: 49900,
      yearlyPricePaise: 499900,

      razorpayPlanIds: {
        monthly: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID || null,
        yearly: process.env.RAZORPAY_STARTER_YEARLY_PLAN_ID || null,
      },
    },

    growth: {
      name: 'Growth',
      enabled: true,

      messageLimit: 5000,

      monthlyPricePaise: 99900,
      yearlyPricePaise: 999900,

      razorpayPlanIds: {
        monthly: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID || null,
        yearly: process.env.RAZORPAY_GROWTH_YEARLY_PLAN_ID || null,
      },
    },

    business: {
      name: 'Business',
      enabled: true,

      messageLimit: 15000,

      monthlyPricePaise: 199900,
      yearlyPricePaise: 1999900,

      razorpayPlanIds: {
        monthly: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID || null,
        yearly: process.env.RAZORPAY_BUSINESS_YEARLY_PLAN_ID || null,
      },
    },
  },
};

export default SUBSCRIPTION_CONFIG;
