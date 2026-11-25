
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

export const auth = async (req, res, next) => {
  let decoded;

  // Step 1: Verify CRM JWT
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        error: 'Please sign in again',
      });
    }

    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (!decoded.id || !decoded.iat) {
      return res.status(401).json({
        error: 'Please sign in again',
      });
    }
  } catch {
    return res.status(401).json({
      error: 'Please sign in again',
    });
  }

  // Step 2: Check whether the user still exists
  try {
    const user = await User.findById(decoded.id)
      .select('passwordChangedAt');

    if (!user) {
      return res.status(401).json({
        error: 'Please sign in again',
      });
    }

    // Step 3: Reject tokens issued before password change
    if (
      user.passwordChangedAt &&
      decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return res.status(401).json({
        error: 'Your password has changed. Please sign in again.',
      });
    }

    req.userId = user._id;

    return next();
  } catch (error) {
    return next(error);
  }
};

// Async controller error wrapper
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
