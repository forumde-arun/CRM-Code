
import crypto from 'crypto';

import Connection from '../models/Connection.js';
import { encrypt, decrypt } from '../utils/crypto.js';

import {
  exchangeCode,
  registerPhone,
  subscribeApp,
  phoneInfo,
  phoneDetails,
  subscribedApps,
  metaConfig,
} from '../services/meta.js';

import { log } from '../utils/logger.js';

// ============================================
// HELPERS
// ============================================

const fail = (message, status) =>
  Object.assign(new Error(message), { status });

const tail = (value) =>
  value ? `...${String(value).slice(-4)}` : 'empty';

// ============================================
// GET ACTIVE WHATSAPP CONNECTION
// Used by templates and campaigns
// ============================================

export async function getActive(userId) {
  const connection = await Connection.findOne({
    user: userId,
  });

  if (!connection) {
    throw fail('Connect WhatsApp first.', 400);
  }

  if (connection.status !== 'connected') {
    throw fail(
      'Your WhatsApp connection needs to be reconnected.',
      400
    );
  }

  return {
    conn: connection,
    token: decrypt(connection.token),
  };
}

// ============================================
// PUBLIC CONNECTION RESPONSE
// Never expose access tokens
// ============================================

const view = (connection) => ({
  connected: connection.status === 'connected',
  status: connection.status,
  wabaId: connection.wabaId,
  phoneNumberId: connection.phoneNumberId,
  displayPhone: connection.displayPhone,
  verifiedName: connection.verifiedName,
  quality: connection.quality,
});

// ============================================
// SAVE WHATSAPP CONNECTION
// Access token and PIN are encrypted
// ============================================

async function save(
  userId,
  { wabaId, phoneNumberId, token, pin }
) {
  const info = await phoneInfo(
    phoneNumberId,
    token
  );

  return Connection.findOneAndUpdate(
    { user: userId },
    {
      wabaId,
      phoneNumberId,
      token: encrypt(token),

      ...(pin && {
        pin: encrypt(pin),
      }),

      displayPhone: info.display_phone_number,
      verifiedName: info.verified_name,
      quality: info.quality_rating,
      status: 'connected',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

// ============================================
// CONNECTION DIAGNOSTICS
// ============================================

async function diagnose(connection, token) {
  try {
    const phone = await phoneDetails(
      connection.phoneNumberId,
      token
    );

    log.info('DIAG', 'WhatsApp phone details', {
      number: connection.displayPhone,
      status: phone.status,
      verification: phone.code_verification_status,
      mode: phone.account_mode,
      platform: phone.platform_type,
      quality: phone.quality_rating,
    });

    if (
      phone.status &&
      phone.status !== 'CONNECTED'
    ) {
      log.warn(
        'DIAG',
        `Phone status is "${phone.status}", not CONNECTED. Messages may not be delivered.`
      );
    }

    const subscriptions = await subscribedApps(
      connection.wabaId,
      token
    );

    const appId = metaConfig().appId;

    const isSubscribed =
      Boolean(appId) &&
      JSON.stringify(subscriptions).includes(appId);

    if (isSubscribed) {
      log.info(
        'DIAG',
        'This app is subscribed to the WhatsApp account.'
      );
    } else {
      log.warn(
        'DIAG',
        'This app is NOT subscribed to the WhatsApp account. Webhooks may not be delivered.'
      );
    }
  } catch (error) {
    log.warn(
      'DIAG',
      'Connection diagnostics skipped: ' + error.message
    );
  }
}

// ============================================
// PUBLIC META CONFIGURATION
// Used by the frontend before Embedded Signup
//
// This endpoint returns public identifiers only.
// META_APP_SECRET is NEVER returned.
// ============================================

export const config = (_req, res) => {
  const {
    appId,
    configId,
    version,
  } = metaConfig();

  const validAppId =
    /^\d{10,20}$/.test(appId);

  if (!validAppId || !configId) {
    log.error(
      'CONNECT',
      'Embedded Signup configuration is incomplete',
      {
        appIdValid: validAppId,
        configIdSet: Boolean(configId),
      }
    );

    return res.status(503).json({
      error:
        'WhatsApp Embedded Signup is not configured correctly on the backend.',
    });
  }

  return res.json({
    appId,
    configId,
    version,
  });
};

// ============================================
// EMBEDDED SIGNUP
//
// Frontend sends:
// code, wabaId, phoneNumberId, appId
//
// Backend:
// 1. Validates configuration
// 2. Checks frontend/backend App ID match
// 3. Exchanges authorization code
// 4. Registers WhatsApp phone
// 5. Subscribes app to WABA
// 6. Saves encrypted connection
// ============================================

export const connectEmbedded = async (req, res) => {
  const {
    code,
    wabaId,
    phoneNumberId,
    appId,
  } = req.body || {};

  // ------------------------------------------
  // Validate signup response
  // ------------------------------------------

  if (!code || !wabaId || !phoneNumberId) {
    return res.status(400).json({
      error:
        'Meta did not return the authorization code, WABA ID or phone number ID.',
    });
  }

  // ------------------------------------------
  // Read backend Meta configuration
  // ------------------------------------------

  const cfg = metaConfig();

  if (!cfg.appId || !cfg.appSecret) {
    log.error(
      'CONNECT',
      'META_APP_ID or META_APP_SECRET is missing on the backend',
      {
        appIdSet: Boolean(cfg.appId),
        secretSet: Boolean(cfg.appSecret),
      }
    );

    return res.status(500).json({
      error:
        'Meta application credentials are not configured on the backend.',
    });
  }

  // ------------------------------------------
  // Validate App ID format
  // ------------------------------------------

  if (!/^\d{10,20}$/.test(cfg.appId)) {
    log.error(
      'CONNECT',
      'META_APP_ID has an invalid format',
      {
        appIdLength: cfg.appId.length,
        appIdEnds: tail(cfg.appId),
      }
    );

    return res.status(500).json({
      error:
        `Backend setting META_APP_ID is invalid (${cfg.appId.length} characters, ending ${tail(cfg.appId)}). ` +
        'It must be the numeric App ID from Meta App settings > Basic.',
    });
  }

  // ------------------------------------------
  // Validate Embedded Signup Configuration ID
  // ------------------------------------------

  if (!cfg.configId) {
    log.error(
      'CONNECT',
      'META_CONFIG_ID is missing on the backend.'
    );

    return res.status(500).json({
      error:
        'META_CONFIG_ID is missing from the backend configuration.',
    });
  }

  // ------------------------------------------
  // Check frontend/backend App ID consistency
  // ------------------------------------------

  if (
    appId &&
    String(appId).trim() !== cfg.appId
  ) {
    log.error(
      'CONNECT',
      'Frontend and backend Meta App IDs do not match',
      {
        frontend: tail(appId),
        backend: tail(cfg.appId),
      }
    );

    return res.status(400).json({
      error:
        `Meta App ID mismatch: the popup used an App ID ending ${tail(appId)}, ` +
        `but the backend uses one ending ${tail(cfg.appId)}. ` +
        'Both must belong to the same Meta application.',
    });
  }

  // ------------------------------------------
  // Authorization code exchange
  // ------------------------------------------

  log.info(
    'CONNECT',
    'Starting Embedded Signup code exchange',
    {
      appIdLength: cfg.appId.length,
      appIdEnds: tail(cfg.appId),
      secretLength: cfg.appSecret.length,
      graphVersion: cfg.version,
    }
  );

  // exchangeCode validates the App ID and App Secret
  // and makes the request to Meta.

  const { access_token: accessToken } =
    await exchangeCode(code);

  if (!accessToken) {
    log.error(
      'CONNECT',
      'Meta code exchange did not return an access token.'
    );

    return res.status(502).json({
      error:
        'Meta authorization failed: no access token was returned.',
    });
  }

  // ------------------------------------------
  // Register WhatsApp phone number
  // ------------------------------------------

  const pin = String(
    crypto.randomInt(100000, 1000000)
  );

  const warnings = [];

  try {
    await registerPhone(
      phoneNumberId,
      accessToken,
      pin
    );

    log.info(
      'CONNECT',
      'WhatsApp phone registration completed.'
    );
  } catch (error) {
    warnings.push(
      'Phone registration: ' + error.message
    );

    log.warn(
      'CONNECT',
      'Phone registration warning: ' + error.message
    );
  }

  // ------------------------------------------
  // Subscribe app to WhatsApp Business Account
  // ------------------------------------------

  await subscribeApp(
    wabaId,
    accessToken
  );

  log.info(
    'CONNECT',
    'WhatsApp app subscription completed.',
    {
      wabaId,
    }
  );

  // ------------------------------------------
  // Save encrypted connection
  // ------------------------------------------

  const connection = await save(
    req.userId,
    {
      wabaId,
      phoneNumberId,
      token: accessToken,
      pin,
    }
  );

  log.info(
    'CONNECT',
    'WhatsApp Embedded Signup connection saved successfully',
    {
      wabaId,
      phoneNumberId,
    }
  );

  // Diagnostics should not delay the API response.
  void diagnose(connection, accessToken);

  return res.json({
    ...view(connection),
    warnings,
  });
};

// ============================================
// MANUAL DEVELOPER CONNECTION
// System User access token
// ============================================

export const connectManual = async (req, res) => {
  const {
    wabaId,
    phoneNumberId,
    token,
  } = req.body || {};

  if (!wabaId || !phoneNumberId || !token) {
    return res.status(400).json({
      error:
        'WABA ID, phone number ID and access token are required.',
    });
  }

  // Subscribe app to WABA.
  // Keep manual connection available even if subscription
  // needs to be configured separately.

  try {
    await subscribeApp(wabaId, token);

    log.info(
      'CONNECT',
      'Manual connection subscription completed.',
      { wabaId }
    );
  } catch (error) {
    log.warn(
      'CONNECT',
      'Manual connection subscription warning: ' +
        error.message
    );
  }

  const connection = await save(
    req.userId,
    {
      wabaId,
      phoneNumberId,
      token,
    }
  );

  log.info(
    'CONNECT',
    'Manual WhatsApp connection saved successfully',
    {
      wabaId,
      phoneNumberId,
    }
  );

  return res.json(view(connection));
};

// ============================================
// CONNECTION STATUS
// ============================================

export const status = async (req, res) => {
  const connection = await Connection.findOne({
    user: req.userId,
  });

  if (!connection) {
    return res.json({
      connected: false,
      status: 'none',
    });
  }

  const token = decrypt(connection.token);

  try {
    const info = await phoneInfo(
      connection.phoneNumberId,
      token
    );

    connection.quality = info.quality_rating;
    connection.status = 'connected';

  } catch (error) {
    if (error.code === 190) {
      connection.status = 'needs_reauth';
    } else {
      throw error;
    }
  }

  await connection.save();

  if (connection.status === 'connected') {
    void diagnose(connection, token);
  }

  return res.json(view(connection));
};

// ============================================
// DISCONNECT WHATSAPP
// ============================================

export const disconnect = async (req, res) => {
  await Connection.deleteOne({
    user: req.userId,
  });

  return res.json({
    ok: true,
  });
};
