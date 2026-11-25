
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env } from '../config/env.js';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';

import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../services/email.service.js';

// Firebase Secure Token public keys
const firebaseJWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

// Standard CRM authentication response
const out = (user) => ({
  token: jwt.sign(
    { id: user._id },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  ),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    emailVerified: user.emailVerified,
  },
});

// ============================================
// REGISTER - MongoDB + bcrypt
// ============================================

export const register = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || password.length < 8 || password.length > 72) {
    return res.status(400).json({
      error: 'Name, valid email and password of 8–72 characters are required.',
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      error: 'Invalid email address.',
    });
  }

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({
      error: 'This email is already registered. Please log in.',
    });
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    emailVerified: false,
  });

  // Welcome email failure should not undo account creation.
  try {
    await sendWelcomeEmail(user.name, user.email);
  } catch (error) {
    console.error('[EMAIL] Welcome email failed:', error.message);
  }

  return res.status(201).json(out(user));
};

// ============================================
// LOGIN - MongoDB + bcrypt
// ============================================

export const login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  ) {
    return res.status(401).json({
      error: 'Wrong email or password. If you signed up with Google, use Google sign-in.',
    });
  }

  return res.json(out(user));
};

// ============================================
// GOOGLE LOGIN - Firebase + MongoDB
// ============================================

export const google = async (req, res) => {
  const idToken = req.body.idToken;

  if (!idToken) {
    return res.status(400).json({
      error: 'Firebase ID token is required.',
    });
  }

  if (!env.FIREBASE_PROJECT_ID) {
    return res.status(503).json({
      error: 'Google Sign-In is not configured.',
    });
  }

  let payload;

  try {
    const verified = await jwtVerify(idToken, firebaseJWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });

    payload = verified.payload;
  } catch (error) {
    console.error(
      '[AUTH] Firebase token verification failed:',
      error.message
    );

    return res.status(401).json({
      error: 'Invalid or expired Google authentication token.',
    });
  }

  const firebaseUid = payload.sub;
  const email = String(payload.email || '').trim().toLowerCase();

  if (!firebaseUid || !email || payload.email_verified !== true) {
    return res.status(401).json({
      error: 'Google account email could not be verified.',
    });
  }

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    // Prevent linking an account to a different Firebase identity.
    if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
      return res.status(409).json({
        error: 'This account is linked to another Google identity.',
      });
    }

    user.firebaseUid = firebaseUid;
    user.emailVerified = true;
    user.avatar = payload.picture || user.avatar || '';
    user.name = user.name || payload.name || 'CRM User';

    await user.save();
  } else {
    user = await User.create({
      name: payload.name || 'CRM User',
      email,
      firebaseUid,
      avatar: payload.picture || '',
      emailVerified: true,
    });
  }

  return res.json(out(user));
};

// ============================================
// FORGOT PASSWORD - MongoDB + Resend
// ============================================

export const forgotPassword = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  const genericResponse = {
    message:
      'If an account exists for this email, a password reset link will be sent.',
  };

  if (!email) {
    return res.status(200).json(genericResponse);
  }

  const user = await User.findOne({ email }).select('+password');

  // Do not reveal whether an account exists.
  if (!user || !user.password) {
    return res.status(200).json(genericResponse);
  }

  if (!env.APP_URL || !env.EMAIL_FROM || !env.EMAIL_API_KEY) {
    console.error(
      '[AUTH] Password reset email configuration is incomplete.'
    );

    return res.status(503).json({
      error: 'Password reset is temporarily unavailable.',
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TTL_MIN * 60 * 1000
  );

  // Invalidate previous reset links for this user.
  await PasswordReset.deleteMany({ user: user._id });

  await PasswordReset.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  const appUrl = env.APP_URL.replace(/\/+$/, '');

  const resetUrl =
    `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (error) {
    await PasswordReset.deleteOne({ tokenHash });

    console.error(
      '[EMAIL] Password reset email failed:',
      error.message
    );

    return res.status(503).json({
      error: 'Unable to send reset email. Please try again later.',
    });
  }

  return res.json(genericResponse);
};

// ============================================
// RESET PASSWORD - Single-use token
// ============================================

export const resetPassword = async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token || password.length < 8 || password.length > 72) {
    return res.status(400).json({
      error: 'A valid reset token and password of 8–72 characters are required.',
    });
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Atomically consume the token so it cannot be reused.
  const resetRequest = await PasswordReset.findOneAndUpdate(
    {
      tokenHash,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    },
    {
      $set: { usedAt: new Date() },
    },
    {
      new: true,
    }
  );

  if (!resetRequest) {
    return res.status(400).json({
      error: 'Password reset link is invalid or expired.',
    });
  }

  const user = await User.findById(resetRequest.user);

  if (!user) {
    return res.status(400).json({
      error: 'Password reset link is invalid or expired.',
    });
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date();

  await user.save();

  // Remove all other reset requests belonging to this user.
  await PasswordReset.deleteMany({
    user: user._id,
    _id: { $ne: resetRequest._id },
  });

  return res.json({
    message: 'Password has been reset successfully. Please log in.',
  });
};

// ============================================
// CURRENT USER
// ============================================

export const me = async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      emailVerified: user.emailVerified,
    },
  });
};
