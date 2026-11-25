
import { api } from '@/lib/api';

/**
 * CRM Subscription API
 *
 * Uses the existing shared API client.
 * JWT authentication is automatically handled by api.js.
 *
 * Do not add another /api prefix.
 */

const unwrap = (response) => {
  return response?.data ?? response;
};

export const subscriptionApi = {

  /**
   * Get all available subscription plans.
   * GET /api/plans
   */
  async getPlans() {
    const response = await api.get('/plans');
    return unwrap(response);
  },

  /**
   * Get current user's subscription.
   * GET /api/subscription/me
   */
  async getMySubscription() {
    const response = await api.get('/subscription/me');
    return unwrap(response);
  },

  /**
   * Get payment history.
   * GET /api/payments/history
   */
  async getPaymentHistory() {
    const response = await api.get('/payments/history');

    const data = unwrap(response);

    return Array.isArray(data)
      ? data
      : data?.payments || [];
  },

  /**
   * Create Razorpay payment order.
   * POST /api/payments/orders
   */
  async createPaymentOrder(planCode, billingCycle = 'monthly') {
    if (!planCode) {
      throw new Error('Subscription plan is required.');
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      throw new Error('Invalid billing cycle.');
    }

    const response = await api.post('/payments/orders', {
      planCode,
      billingCycle,
    });

    return unwrap(response);
  },

  /**
   * Verify Razorpay payment.
   * POST /api/payments/verify
   */
  async verifyPayment(paymentDetails) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = paymentDetails || {};

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new Error(
        'Incomplete Razorpay payment verification details.'
      );
    }

    const response = await api.post('/payments/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return unwrap(response);
  },

  /**
   * Convenience method:
   * Refresh subscription and payment history together.
   */
  async refreshBillingDetails() {
    const [subscription, payments] = await Promise.all([
      this.getMySubscription(),
      this.getPaymentHistory(),
    ]);

    return {
      subscription,
      payments,
    };
  },
};

export default subscriptionApi;
