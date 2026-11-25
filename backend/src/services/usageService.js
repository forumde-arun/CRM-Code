
import mongoose from 'mongoose';

import Subscription from '../models/Subscription.js';
import UsageLedger from '../models/UsageLedger.js';

/**
 * Reserve message credits before a campaign starts sending.
 *
 * idempotencyKey must be unique for each reservation operation.
 */
export const reserveMessages = async ({
  userId,
  quantity,
  campaignId = null,
  idempotencyKey,
}) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Reservation quantity must be a positive integer.');
  }

  if (!idempotencyKey) {
    throw new Error('An idempotency key is required.');
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existingEntry = await UsageLedger.findOne({
        idempotencyKey,
      }).session(session);

      if (existingEntry) {
        result = {
          success: true,
          duplicate: true,
          message: 'This reservation has already been processed.',
        };
        return;
      }

      const subscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (!subscription) {
        throw new Error('Subscription not found.');
      }

      const now = new Date();

      const hasAccess =
        subscription.status === 'trial' ||
        subscription.status === 'active' ||
        (
          subscription.status === 'cancelled' &&
          subscription.cancelAtPeriodEnd &&
          subscription.subscriptionEndsAt &&
          subscription.subscriptionEndsAt > now
        );

      if (!hasAccess) {
        throw new Error('Your subscription is not active.');
      }

      const available =
        subscription.messageLimit -
        subscription.messagesUsed -
        subscription.messagesReserved;

      if (available < quantity) {
        throw new Error('Insufficient message credits.');
      }

      const updated = await Subscription.updateOne(
        {
          _id: subscription._id,
          messagesReserved: subscription.messagesReserved,
          messagesUsed: subscription.messagesUsed,
          messageLimit: subscription.messageLimit,
          status: subscription.status,
        },
        {
          $inc: {
            messagesReserved: quantity,
          },
        },
        { session }
      );

      if (updated.modifiedCount !== 1) {
        throw new Error('Could not reserve credits. Please retry.');
      }

      await UsageLedger.create(
        [
          {
            user: userId,
            subscription: subscription._id,
            type: 'reservation',
            quantity,
            balanceBefore: available,
            balanceAfter: available - quantity,
            campaign: campaignId,
            idempotencyKey,
            description: 'Message credits reserved for campaign',
          },
        ],
        { session }
      );

      result = {
        success: true,
        duplicate: false,
        reserved: quantity,
        remaining: available - quantity,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Consume reserved credits when Meta accepts messages.
 *
 * Use a unique idempotencyKey for each settlement operation.
 */
export const consumeReservedMessages = async ({
  userId,
  quantity,
  campaignId = null,
  idempotencyKey,
}) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Consumption quantity must be a positive integer.');
  }

  if (!idempotencyKey) {
    throw new Error('An idempotency key is required.');
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existingEntry = await UsageLedger.findOne({
        idempotencyKey,
      }).session(session);

      if (existingEntry) {
        result = {
          success: true,
          duplicate: true,
          message: 'This consumption has already been processed.',
        };
        return;
      }

      const subscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (!subscription) {
        throw new Error('Subscription not found.');
      }

      if (subscription.messagesReserved < quantity) {
        throw new Error('Not enough reserved credits to consume.');
      }

      const availableBefore =
        subscription.messageLimit -
        subscription.messagesUsed -
        subscription.messagesReserved;

      const updated = await Subscription.updateOne(
        {
          _id: subscription._id,
          messagesReserved: { $gte: quantity },
          messagesUsed: subscription.messagesUsed,
        },
        {
          $inc: {
            messagesReserved: -quantity,
            messagesUsed: quantity,
          },
        },
        { session }
      );

      if (updated.modifiedCount !== 1) {
        throw new Error('Could not consume reserved credits.');
      }

      await UsageLedger.create(
        [
          {
            user: userId,
            subscription: subscription._id,
            type: 'consumption',
            quantity,
            balanceBefore: availableBefore + quantity,
            balanceAfter: availableBefore,
            campaign: campaignId,
            idempotencyKey,
            description: 'Credits consumed for Meta-accepted messages',
          },
        ],
        { session }
      );

      result = {
        success: true,
        duplicate: false,
        consumed: quantity,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Release reserved credits when messages are rejected or fail.
 */
export const releaseReservedMessages = async ({
  userId,
  quantity,
  campaignId = null,
  idempotencyKey,
}) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Release quantity must be a positive integer.');
  }

  if (!idempotencyKey) {
    throw new Error('An idempotency key is required.');
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existingEntry = await UsageLedger.findOne({
        idempotencyKey,
      }).session(session);

      if (existingEntry) {
        result = {
          success: true,
          duplicate: true,
          message: 'This release has already been processed.',
        };
        return;
      }

      const subscription = await Subscription.findOne({
        user: userId,
      }).session(session);

      if (!subscription) {
        throw new Error('Subscription not found.');
      }

      if (subscription.messagesReserved < quantity) {
        throw new Error('Not enough reserved credits to release.');
      }

      const availableBefore =
        subscription.messageLimit -
        subscription.messagesUsed -
        subscription.messagesReserved;

      const updated = await Subscription.updateOne(
        {
          _id: subscription._id,
          messagesReserved: { $gte: quantity },
        },
        {
          $inc: {
            messagesReserved: -quantity,
          },
        },
        { session }
      );

      if (updated.modifiedCount !== 1) {
        throw new Error('Could not release reserved credits.');
      }

      await UsageLedger.create(
        [
          {
            user: userId,
            subscription: subscription._id,
            type: 'release',
            quantity,
            balanceBefore: availableBefore,
            balanceAfter: availableBefore + quantity,
            campaign: campaignId,
            idempotencyKey,
            description: 'Reserved credits released after message failure',
          },
        ],
        { session }
      );

      result = {
        success: true,
        duplicate: false,
        released: quantity,
        remaining: availableBefore + quantity,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export default {
  reserveMessages,
  consumeReservedMessages,
  releaseReservedMessages,
};
