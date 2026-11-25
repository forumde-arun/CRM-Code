
import { api } from '@/lib/api';

/**
 * CRM Authentication API
 *
 * Uses the existing shared API client.
 * Saves the CRM JWT returned by the backend.
 */

const saveAuthToken = (response) => {
  const data = response?.data ?? response;

  if (!data?.token) {
    throw new Error(
      'Authentication response did not contain a token.'
    );
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }

  return response;
};

export const authApi = {
  /**
   * Register a new account.
   */
  async signup(data) {
    const response = await api.post('/auth/register', {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    return saveAuthToken(response);
  },

  /**
   * Login with email and password.
   */
  async login(data) {
    const response = await api.post('/auth/login', {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    return saveAuthToken(response);
  },

  /**
   * Login or register using Google ID token.
   */
  async googleLogin(idToken) {
    const response = await api.post('/auth/google', {
      idToken,
    });

    return saveAuthToken(response);
  },

  /**
   * Request password reset email.
   */
  async forgotPassword(email) {
    return api.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
  },

  /**
   * Reset password.
   */
  async resetPassword(data) {
    return api.post('/auth/reset-password', {
      token: data.token,
      password: data.password,
    });
  },

  /**
   * Get currently authenticated user.
   */
  async getCurrentUser() {
    return api.get('/auth/me');
  },
};

export default authApi;
