
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// LOAD ENVIRONMENT CONFIGURATION
// ============================================

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../.env'
);

// Local development:
// Loads backend/.env if available.
//
// Production:
// Uses Cloud Run environment variables.
// dotenv does not overwrite existing environment variables by default.

const result = dotenv.config({
  path: file,
});

if (result.error && result.error.code !== 'ENOENT') {
  throw new Error(
    `Unable to load environment configuration: ${result.error.message}`
  );
}

// ============================================
// NORMALIZE ENVIRONMENT VARIABLES
// ============================================

// Remove accidental whitespace, newlines and matching
// surrounding quotes from environment values.

const normalizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  let normalized = value.trim();

  const hasDoubleQuotes =
    normalized.startsWith('"') && normalized.endsWith('"');

  const hasSingleQuotes =
    normalized.startsWith("'") && normalized.endsWith("'");

  if (hasDoubleQuotes || hasSingleQuotes) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
};

const keysToNormalize = [
  // Database and authentication
  'MONGO_URI',
  'JWT_SECRET',
  'ENCRYPTION_KEY',

  // Meta WhatsApp configuration
  'META_APP_ID',
  'META_APP_SECRET',
  'META_CONFIG_ID',
  'META_GRAPH_VERSION',

  // WhatsApp webhook and API configuration
  'WEBHOOK_VERIFY_TOKEN',
  'CLIENT_URL',
  'MSG_PER_SECOND',

  // Firebase and Google authentication
  'FIREBASE_PROJECT_ID',
  'GOOGLE_CLIENT_ID',

  // Application configuration
  'APP_URL',

  // Email configuration
  'EMAIL_FROM',
  'EMAIL_API_KEY',
  'EMAIL_USER',
  'EMAIL_APP_PASSWORD',

  // Password reset
  'PASSWORD_RESET_TTL_MIN',
];

for (const key of keysToNormalize) {
  if (typeof process.env[key] === 'string') {
    process.env[key] = normalizeValue(process.env[key]);
  }
}

// ============================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================

const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
];

const missing = required.filter(
  (key) => !process.env[key]
);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
}

// ============================================
// ENCRYPTION KEY VALIDATION
// ============================================

// Must contain exactly 64 hexadecimal characters.

if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
  throw new Error(
    'ENCRYPTION_KEY must be exactly 64 hexadecimal characters.'
  );
}

// ============================================
// PASSWORD RESET CONFIGURATION
// ============================================

const resetTTL =
  process.env.PASSWORD_RESET_TTL_MIN || '30';

if (!/^[1-9]\d*$/.test(resetTTL)) {
  throw new Error(
    'PASSWORD_RESET_TTL_MIN must be a positive integer.'
  );
}

const resetTTLNumber = Number(resetTTL);

if (!Number.isSafeInteger(resetTTLNumber)) {
  throw new Error(
    'PASSWORD_RESET_TTL_MIN is outside the supported numeric range.'
  );
}

process.env.PASSWORD_RESET_TTL_MIN = String(resetTTLNumber);

// ============================================
// META CONFIGURATION VALIDATION
// ============================================

// Meta settings are optional during startup so that a missing
// Meta configuration does not prevent unrelated CRM features
// from starting.
//
// Embedded Signup separately validates these values through
// metaConfig() and the /connection/config endpoint.

if (
  process.env.META_APP_ID &&
  !/^\d{10,20}$/.test(process.env.META_APP_ID)
) {
  console.warn(
    '[CONFIG] META_APP_ID has an invalid format. WhatsApp Embedded Signup will be unavailable until corrected.'
  );
}

if (!process.env.META_APP_ID) {
  console.warn(
    '[CONFIG] META_APP_ID is missing. WhatsApp Embedded Signup will be unavailable.'
  );
}

if (!process.env.META_APP_SECRET) {
  console.warn(
    '[CONFIG] META_APP_SECRET is missing. Meta authorization will be unavailable.'
  );
}

if (!process.env.META_CONFIG_ID) {
  console.warn(
    '[CONFIG] META_CONFIG_ID is missing. WhatsApp Embedded Signup will be unavailable.'
  );
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

if (!process.env.META_GRAPH_VERSION) {
  process.env.META_GRAPH_VERSION = 'v21.0';
}

if (!process.env.MSG_PER_SECOND) {
  process.env.MSG_PER_SECOND = '10';
}

// ============================================
// EXPORTED APPLICATION CONFIGURATION
// ============================================

// Never expose META_APP_SECRET through a frontend response.

export const env = {
  // Database and security
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  // Meta public configuration
  META_APP_ID: process.env.META_APP_ID || '',
  META_CONFIG_ID: process.env.META_CONFIG_ID || '',
  META_GRAPH_VERSION: process.env.META_GRAPH_VERSION,

  // Webhook and API
  WEBHOOK_VERIFY_TOKEN:
    process.env.WEBHOOK_VERIFY_TOKEN || '',
  CLIENT_URL: process.env.CLIENT_URL || '',
  MSG_PER_SECOND: Number(process.env.MSG_PER_SECOND),

  // Firebase and Google
  FIREBASE_PROJECT_ID:
    process.env.FIREBASE_PROJECT_ID || '',
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID || '',

  // Application
  APP_URL: process.env.APP_URL || '',

  // Email
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  EMAIL_API_KEY: process.env.EMAIL_API_KEY || '',

  // Password reset
  PASSWORD_RESET_TTL_MIN: resetTTLNumber,
};

// ============================================
// OPTIONAL CONFIGURATION WARNINGS
// ============================================

if (!env.FIREBASE_PROJECT_ID && !env.GOOGLE_CLIENT_ID) {
  console.warn(
    '[CONFIG] Firebase/Google authentication configuration is missing.'
  );
}

if (!env.APP_URL) {
  console.warn(
    '[CONFIG] APP_URL is missing. Password reset links may not work.'
  );
}

if (!env.EMAIL_FROM || !env.EMAIL_API_KEY) {
  console.warn(
    '[CONFIG] Email configuration is incomplete. Email delivery may be unavailable.'
  );
}

if (!env.CLIENT_URL) {
  console.warn(
    '[CONFIG] CLIENT_URL is missing. Review backend CORS configuration.'
  );
}

console.log('[CONFIG] Environment configuration loaded.');
