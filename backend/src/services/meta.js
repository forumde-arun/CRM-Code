import { log } from '../utils/logger.js';

const base = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export class MetaError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

// Every call to Meta is logged with method, path, HTTP status and time. Tokens are never printed.
async function call(path, { method = 'GET', token, body, params } = {}) {
  const started = Date.now();
  const url = new URL(base() + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  let r;
  try {
    r = await fetch(url, {
      method,
      headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
    });
  } catch (e) {
    log.error('META', `${method} ${path} network error: ${e.message}`);
    throw new MetaError('Cannot reach Meta: ' + e.message);
  }
  const j = await r.json().catch(() => ({}));
  const ms = Date.now() - started;
  if (!r.ok || j.error) {
    const e = j.error || {};
    log.error('META', `${method} ${path} -> ${r.status} (${ms}ms)`, { code: e.code, subcode: e.error_subcode, message: e.message, details: e.error_data?.details, fbtrace_id: e.fbtrace_id });
    throw new MetaError(e.message || `Meta request failed (${r.status})`, e.code);
  }
  log.info('META', `${method} ${path} -> ${r.status} (${ms}ms)`);
  return j;
}
export const phoneDetails = (id, token) => call(`/${id}`, { token, params: { fields: 'display_phone_number,quality_rating,status,code_verification_status,account_mode,platform_type' } });
export const subscribedApps = (waba, token) => call(`/${waba}/subscribed_apps`, { token });
export const exchangeCode = (code) => call('/oauth/access_token', { params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, code } });
export const registerPhone = (id, token, pin) => call(`/${id}/register`, { method: 'POST', token, body: { messaging_product: 'whatsapp', pin } });
export const subscribeApp = (waba, token) => call(`/${waba}/subscribed_apps`, { method: 'POST', token });
export const phoneInfo = (id, token) => call(`/${id}`, { token, params: { fields: 'display_phone_number,verified_name,quality_rating' } });
export const listTemplates = (waba, token) => call(`/${waba}/message_templates`, { token, params: { fields: 'name,status,category,language,components,rejected_reason', limit: 100 } });
export const createTemplate = (waba, token, body) => call(`/${waba}/message_templates`, { method: 'POST', token, body });
export const deleteTemplate = (waba, token, name) => call(`/${waba}/message_templates`, { method: 'DELETE', token, params: { name } });
export const sendTemplate = (id, token, to, name, language, params) => call(`/${id}/messages`, {
  method: 'POST', token,
  body: {
    messaging_product: 'whatsapp', to, type: 'template',
    template: { name, language: { code: language }, components: params.length ? [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }] : [] },
  },
});