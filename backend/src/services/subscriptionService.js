
import mongoose from 'mongoose';

import Subscription from '../models/Subscription.js';
import UsageLedger from '../models/UsageLedger.js';

import { SUBSCRIPTION_CONFIG } from '../config/subscription.js';
import {
  getPlanByCode,
  isSupportedBillingCycle,
} from './planService.js';

// --------------------------------------------------
// DATE HELPERS
// --------------------------------------------------

const addMonths = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDay));

  return result;
};

const getNextPeriodEnd = (periodStart, subscriptionEndsAt) => {
  const nextMonth = addMonths(periodStart, 1);

  if (subscriptionEndsAt && nextMonth > subscriptionEndsAt) {
    return new Date(subscriptionEndsAt);
  }

  return nextMonth;
};

const validateUserId = (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('Invalid user ID.');
  }
};

// --------------------------------------------------
// CREATE FREE TRIAL
// --------------------------------------------------

export const createFreeTrial = async (userId) => {
  validateUserId(userId);

  const existing = await Subscription.findOne({ user: userId });

  if (existing) {
    return existing;
  }

  if (!SUBSCRIPTION_CONFIG.trial.enabled) {
    throw new Error('Free trial is currently disabled.');
  }

  const messageLimit = SUBSCRIPTION_CONFIG.trial.messageLimit;

  if (!Number.isInteger(messageLimit) || messageLimit < 1) {
    throw new Error('Invalid free trial message limit.');
  }

  const session = await mongoose.startSession();

  try {
    let subscription;

    await session.withTransaction(async () => {
      const existingSubscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (existingSubscription) {
        subscription = existingSubscription;
        return;
      }

      const [created] = await Subscription.create(
        [
          {
            user: userId,
            planCode: 'free_trial',
            planName: 'Free Trial',
            billingCycle: 'trial',
            status: 'trial',
            messageLimit,
            messagesUsed: 0,
            messagesReserved: 0,
            trialGrantedAt: new Date(),
            trialUsed: true,
            paymentProvider: 'none',
          },
        ],
        { session }
      );

      subscription = created;

      await UsageLedger.create(
        [
          {
            user: userId,
            subscription: created._id,
            type: 'trial_grant',
            quantity: messageLimit,
            balanceBefore: 0,
            balanceAfter: messageLimit,
            idempotencyKey: `trial-grant:${userId}`,
            description: 'Initial free trial message allowance',
          },
        ],
        { session }
      );
    });

    return subscription;
  } catch (error) {
    if (error.code === 11000) {
      const existingSubscription = await Subscription.findOne({
        user: userId,
      });

      if (existingSubscription) {
        return existingSubscription;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

// --------------------------------------------------
// GET SUBSCRIPTION
// --------------------------------------------------

export const getSubscription = async (userId) => {
  validateUserId(userId);

  return Subscription.findOne({ user: userId });
};

// --------------------------------------------------
// ACTIVATE PAID SUBSCRIPTION
//
// Call this ONLY after verifying successful payment
// or a trusted Razorpay subscription activation event.
// --------------------------------------------------

export const activateSubscription = async ({
  userId,
  planCode,
  billingCycle,
  razorpaySubscriptionId = null,
  razorpayCustomerId = null,
  razorpayPlanId = null,
  paymentId = null,
}) => {
  validateUserId(userId);

  if (!isSupportedBillingCycle(billingCycle)) {
    throw new Error('Unsupported billing cycle.');
  }

  const plan = getPlanByCode(planCode);

  if (!plan) {
    throw new Error('Selected subscription plan is unavailable.');
  }

  const messageLimit = plan.messageLimit;

  if (!Number.isInteger(messageLimit) || messageLimit < 1) {
    throw new Error('Invalid plan message limit.');
  }

  const now = new Date();
  const durationMonths = billingCycle === 'yearly' ? 12 : 1;

  const subscriptionEndsAt = addMonths(now, durationMonths);

  const currentPeriodEnd = getNextPeriodEnd(
    now,
    subscriptionEndsAt
  );

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      let subscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (!subscription) {
        const [created] = await Subscription.create(
          [
            {
              user: userId,
              planCode,
              planName: plan.name,
              billingCycle,
              status: 'active',
              messageLimit,
              messagesUsed: 0,
              messagesReserved: 0,
              trialUsed: true,
              paymentProvider: 'razorpay',
            },
          ],
          { session }
        );

        subscription = created;
      }

      // Do not silently replace a paid subscription that
      // still has an active billing period.
      if (
        subscription.status === 'active' &&
        subscription.subscriptionEndsAt &&
        subscription.subscriptionEndsAt > now
      ) {
        throw new Error(
          'An active paid subscription already exists.'
        );
      }

      subscription.planCode = planCode;
      subscription.planName = plan.name;
      subscription.billingCycle = billingCycle;
      subscription.subscriptionDurationMonths = durationMonths;
      subscription.status = 'active';

      subscription.messageLimit = messageLimit;
      subscription.messagesUsed = 0;

      // Preserve reservations belonging to in-progress campaigns.
      subscription.subscriptionStartedAt = now;
      subscription.subscriptionEndsAt = subscriptionEndsAt;

      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = currentPeriodEnd;
      subscription.nextQuotaResetAt = currentPeriodEnd;

      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = null;

      subscription.paymentProvider = 'razorpay';
      subscription.razorpaySubscriptionId = razorpaySubscriptionId;
      subscription.razorpayCustomerId = razorpayCustomerId;
      subscription.razorpayPlanId = razorpayPlanId;

      subscription.lastPaymentId = paymentId;
      subscription.lastPaymentAt = paymentId ? now : null;

      await subscription.save({ session });

      const idempotencyKey = paymentId
        ? `subscription-activation:${paymentId}`
        : `subscription-activation:${subscription._id}:${now.getTime()}`;

      await UsageLedger.create(
        [
          {
            user: userId,
            subscription: subscription._id,
            type: 'period_grant',
            quantity: messageLimit,
            balanceBefore: 0,
            balanceAfter: Math.max(
              0,
              messageLimit - subscription.messagesReserved
            ),
            idempotencyKey,
            periodStart: now,
            periodEnd: currentPeriodEnd,
            description: `${plan.name} initial message allowance`,
          },
        ],
        { session }
      );

      result = subscription;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// --------------------------------------------------
// MONTHLY QUOTA RESET
//
// Applies to monthly and yearly subscriptions.
// Unused messages do not roll over.
// Outstanding reservations are preserved.
// --------------------------------------------------

export const resetMonthlyQuota = async (userId) => {
  validateUserId(userId);

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const subscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (!subscription) {
        result = null;
        return;
      }

      const now = new Date();

      // A trial has no time-based expiry.
      // It expires when all trial credits are consumed.
      if (
        subscription.status === 'trial' &&
        subscription.messagesUsed >= subscription.messageLimit
      ) {
        subscription.status = 'expired';
        await subscription.save({ session });
        result = subscription;
        return;
      }

      if (
        !['active', 'cancelled'].includes(subscription.status)
      ) {
        result = subscription;
        return;
      }

      // The overall paid subscription has ended.
      if (
        subscription.subscriptionEndsAt &&
        subscription.subscriptionEndsAt <= now
      ) {
        subscription.status = 'expired';
        subscription.cancelAtPeriodEnd = false;

        await subscription.save({ session });

        result = subscription;
        return;
      }

      let updated = false;

      while (
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd <= now
      ) {
        const nextStart = new Date(
          subscription.currentPeriodEnd
        );

        const nextEnd = getNextPeriodEnd(
          nextStart,
          subscription.subscriptionEndsAt
        );

        if (nextEnd <= nextStart) {
          break;
        }

        const idempotencyKey =
          `period-grant:${subscription._id}:${nextStart.toISOString()}`;

        const existingGrant = await UsageLedger.findOne({
          idempotencyKey,
        }).session(session);

        if (!existingGrant) {
          const balanceBefore = Math.max(
            0,
            subscription.messageLimit -
              subscription.messagesUsed -
              subscription.messagesReserved
          );

          // No rollover: old used credits are reset.
          subscription.messagesUsed = 0;

          await UsageLedger.create(
            [
              {
                user: userId,
                subscription: subscription._id,
                type: 'period_grant',
                quantity: subscription.messageLimit,
                balanceBefore,
                balanceAfter: Math.max(
                  0,
                  subscription.messageLimit -
                    subscription.messagesReserved
                ),
                idempotencyKey,
                periodStart: nextStart,
                periodEnd: nextEnd,
                description: 'Monthly message quota renewal',
              },
            ],
            { session }
          );
        }

        subscription.currentPeriodStart = nextStart;
        subscription.currentPeriodEnd = nextEnd;
        subscription.nextQuotaResetAt = nextEnd;

        updated = true;
      }

      if (updated) {
        await subscription.save({ session });
      }

      result = subscription;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// --------------------------------------------------
// SUBSCRIPTION SUMMARY
// --------------------------------------------------

export const getSubscriptionSummary = async (userId) => {
  let subscription = await getSubscription(userId);

  if (!subscription) {
    subscription = await createFreeTrial(userId);
  }

  subscription = await resetMonthlyQuota(userId);

  return {
    planCode: subscription.planCode,
    planName: subscription.planName,
    billingCycle: subscription.billingCycle,
    status: subscription.status,

    messageLimit: subscription.messageLimit,
    messagesUsed: subscription.messagesUsed,
    messagesReserved: subscription.messagesReserved,
    messagesRemaining: subscription.messagesRemaining,
    usagePercentage: subscription.usagePercentage,

    trialGrantedAt: subscription.trialGrantedAt,
    trialUsed: subscription.trialUsed,

    subscriptionStartedAt: subscription.subscriptionStartedAt,
    subscriptionEndsAt: subscription.subscriptionEndsAt,

    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    nextQuotaResetAt: subscription.nextQuotaResetAt,

    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    cancelledAt: subscription.cancelledAt,

    canSendMessages: subscription.canSendMessages,
  };
};

// --------------------------------------------------
// CHECK MESSAGE ACCESS
// --------------------------------------------------

export const canSendMessages = async (
  userId,
  requiredMessages = 1
) => {
  validateUserId(userId);

  if (
    !Number.isInteger(requiredMessages) ||
    requiredMessages < 1
  ) {
    throw new Error(
      'Required message quantity must be a positive integer.'
    );
  }

  let subscription = await getSubscription(userId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_NOT_FOUND',
      message: 'No subscription found for this account.',
    };
  }

  subscription = await resetMonthlyQuota(userId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_NOT_FOUND',
      message: 'No subscription found for this account.',
    };
  }

  const remaining = subscription.messagesRemaining;

  if (!subscription.canSendMessages) {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_INACTIVE',
      message:
        'Your subscription is inactive or your message quota is exhausted.',
      remaining,
    };
  }

  if (remaining < requiredMessages) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_MESSAGE_CREDITS',
      message: 'You do not have enough message credits.',
      remaining,
      required: requiredMessages,
    };
  }

  return {
    allowed: true,
    remaining,
    required: requiredMessages,
  };
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

export default {
  createFreeTrial,
  getSubscription,
  getSubscriptionSummary,
  canSendMessages,
  activateSubscription,
  resetMonthlyQuota,
};
