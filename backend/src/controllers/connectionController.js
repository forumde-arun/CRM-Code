import crypto from 'crypto';
import Connection from '../models/Connection.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { exchangeCode, registerPhone, subscribeApp, phoneInfo, phoneDetails, subscribedApps } from '../services/meta.js';
import { log } from '../utils/logger.js';
const fail = (message, status) => Object.assign(new Error(message), { status });

// Used by templates and campaigns: returns the saved connection and its decrypted token.
export async function getActive(userId) {
  const conn = await Connection.findOne({ user: userId });
  if (!conn) throw fail('Connect WhatsApp first', 400);
  if (conn.status !== 'connected') throw fail('Your WhatsApp connection needs to be reconnected', 400);
  return { conn, token: decrypt(conn.token) };
}

const view = (c) => ({ connected: c.status === 'connected', status: c.status, wabaId: c.wabaId, phoneNumberId: c.phoneNumberId, displayPhone: c.displayPhone, verifiedName: c.verifiedName, quality: c.quality });

async function save(userId, { wabaId, phoneNumberId, token, pin }) {
  const info = await phoneInfo(phoneNumberId, token);
  return Connection.findOneAndUpdate({ user: userId }, {
    wabaId, phoneNumberId, token: encrypt(token), ...(pin && { pin: encrypt(pin) }),
    displayPhone: info.display_phone_number, verifiedName: info.verified_name, quality: info.quality_rating, status: 'connected',
  }, { upsert: true, new: true, setDefaultsOnInsert: true });
}
async function diagnose(c, token) {
  try {
    const p = await phoneDetails(c.phoneNumberId, token);
    log.info('DIAG', 'Phone', { number: c.displayPhone, status: p.status, verification: p.code_verification_status, mode: p.account_mode, platform: p.platform_type, quality: p.quality_rating });
    if (p.status && p.status !== 'CONNECTED') log.warn('DIAG', `Phone status is "${p.status}", not CONNECTED. Messages can be accepted but never delivered`);
    const subs = await subscribedApps(c.wabaId, token);
    const subscribed = JSON.stringify(subs).includes(process.env.META_APP_ID);
    if (subscribed) log.info('DIAG', 'This app is subscribed to your WhatsApp account, so webhooks can be sent');
    else log.warn('DIAG', 'This app is NOT subscribed to your WhatsApp account, so Meta will not send webhooks');
  } catch (e) { log.warn('DIAG', 'Diagnostics skipped: ' + e.message); }
}
// One-click flow: frontend sends the Embedded Signup code + IDs, backend does the rest.
export const connectEmbedded = async (req, res) => {
  const { code, wabaId, phoneNumberId } = req.body;
  if (!code || !wabaId || !phoneNumberId) return res.status(400).json({ error: 'Meta did not return the code, WABA ID or phone number ID' });
  const { access_token } = await exchangeCode(code);
  const pin = String(crypto.randomInt(100000, 1000000));
  const warnings = [];
  try { await registerPhone(phoneNumberId, access_token, pin); } catch (e) { warnings.push('Phone registration: ' + e.message); }
  await subscribeApp(wabaId, access_token);
  const c = await save(req.userId, { wabaId, phoneNumberId, token: access_token, pin });
  res.json({ ...view(c), warnings });
};

// Developer shortcut: connect with a System User token before App Review is done.
export const connectManual = async (req, res) => {
  const { wabaId, phoneNumberId, token } = req.body;
  if (!wabaId || !phoneNumberId || !token) return res.status(400).json({ error: 'WABA ID, phone number ID and token are required' });
  await subscribeApp(wabaId, token).catch(() => {});
  res.json(view(await save(req.userId, { wabaId, phoneNumberId, token })));
};

export const status = async (req, res) => {
  const c = await Connection.findOne({ user: req.userId });
  if (!c) return res.json({ connected: false, status: 'none' });
  const token = decrypt(c.token);
  try {
    const i = await phoneInfo(c.phoneNumberId, token);
    c.quality = i.quality_rating; c.status = 'connected';
  } catch (e) {
    if (e.code === 190) c.status = 'needs_reauth'; else throw e;
  }
  await c.save();
  if (c.status === 'connected') diagnose(c, token);
  res.json(view(c));
};

export const disconnect = async (req, res) => {
  await Connection.deleteOne({ user: req.userId });
  res.json({ ok: true });
};
