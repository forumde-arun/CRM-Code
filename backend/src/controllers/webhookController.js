import crypto from 'crypto';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import Connection from '../models/Connection.js';
import { log, mask } from '../utils/logger.js';

const ORDER = ['queued', 'sent', 'delivered', 'read'];

export const verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    log.info('WEBHOOK', 'Verification succeeded: Meta can reach this server');
    return res.status(200).send(req.query['hub.challenge']);
  }
  log.warn('WEBHOOK', `Verification FAILED (mode=${mode}, ${token ? 'token does not match WEBHOOK_VERIFY_TOKEN' : 'no token sent'})`);
  res.sendStatus(403);
};

export const receive = async (req, res) => {
  const header = req.get('x-hub-signature-256');
  if (!header) {
    log.warn('WEBHOOK', 'POST without X-Hub-Signature-256 header, so it did not come from Meta. Rejected');
    return res.sendStatus(401);
  }
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET || '').update(req.rawBody || '').digest('hex');
  const a = Buffer.from(header), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    log.error('WEBHOOK', 'Signature mismatch: META_APP_SECRET in backend/.env does not match your Meta app. Rejected');
    return res.sendStatus(401);
  }
  res.sendStatus(200);
  log.info('WEBHOOK', 'Received from Meta, signature OK');
  if (process.env.LOG_WEBHOOK_BODY === '1') log.info('WEBHOOK', 'Raw body', req.body);

  try {
    for (const entry of req.body.entry || []) for (const ch of entry.changes || []) {
      const v = ch.value || {};
      log.info('WEBHOOK', `Event field="${ch.field}"`, { statuses: v.statuses?.length || 0, messages: v.messages?.length || 0 });

      for (const s of v.statuses || []) {
        const err = s.errors?.[0];
        log.info('WEBHOOK', `Status ${s.status.toUpperCase()} for ${mask(s.recipient_id)} (message ${s.id})`);
        if (err) log.error('WEBHOOK', `Delivery error ${err.code}: ${err.title || err.message}`, err.error_data?.details || err.message);
        if (s.status !== 'failed' && !ORDER.includes(s.status)) continue;
        const lower = s.status === 'failed' ? ORDER : ORDER.slice(0, ORDER.indexOf(s.status)); // never move a status backwards
        const r = await Campaign.updateOne(
          { 'messages.waId': s.id },
          { $set: { 'messages.$[m].status': s.status, ...(err && { 'messages.$[m].error': `${err.code}: ${err.title || err.message}` }) } },
          { arrayFilters: [{ 'm.waId': s.id, 'm.status': { $in: lower } }] },
        );
        if (!r.matchedCount) log.warn('WEBHOOK', `No campaign has message ${s.id} (was it sent from another app or test?)`);
        else log.info('WEBHOOK', r.modifiedCount ? `Campaign updated to ${s.status}` : `Already at or past ${s.status}, nothing changed`);
      }

      const conn = v.messages?.length ? await Connection.findOne({ phoneNumberId: v.metadata?.phone_number_id }) : null;
      if (v.messages?.length && !conn) log.warn('WEBHOOK', `Inbound message for unknown phone_number_id ${v.metadata?.phone_number_id}`);
      for (const m of conn ? v.messages : []) {
        const upd = { lastInboundAt: new Date() }; // customer wrote to us: 24h reply window is open
        const text = m.text?.body || '';
        log.info('WEBHOOK', `Inbound ${m.type} from ${mask(m.from)}${text ? `: "${text.slice(0, 40)}"` : ''}`);
        if (/^\s*stop\s*$/i.test(text)) { upd.optedIn = false; log.info('CONTACT', `${mask(m.from)} replied STOP: opted out`); }
        const r = await Contact.updateOne({ user: conn.user, phone: m.from }, upd);
        log.info('CONTACT', r.matchedCount ? `${mask(m.from)}: 24h reply window opened` : `${mask(m.from)} is not in your contacts, nothing updated`);
      }
    }
  } catch (e) { log.error('WEBHOOK', 'Processing failed: ' + e.message); }
};