import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import Connection from '../models/Connection.js';
import { getActive } from './connectionController.js';
import { sendTemplate, listTemplates } from '../services/meta.js';
import { log, mask } from '../utils/logger.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Sends one template message per opted-in contact, at a controlled rate.
async function run(id, conn, token) {
  const c = await Campaign.findById(id);
  const gap = 1000 / Number(process.env.MSG_PER_SECOND || 10);
  let state = 'completed', sent = 0, failed = 0;
  log.info('CAMPAIGN', `"${c.name}" starting: ${c.messages.length} recipient(s), template ${c.templateName}/${c.language}, sender phone_number_id ${conn.phoneNumberId}`);
  for (const m of c.messages) {
    const params = c.variables.map((v) => v.replaceAll('{{name}}', m.contactName || 'there'));
    const where = { _id: id, 'messages._id': m._id };
    try {
      const r = await sendTemplate(conn.phoneNumberId, token, m.phone, c.templateName, c.language, params);
      const waId = r.messages?.[0]?.id;
      await Campaign.updateOne(where, { $set: { 'messages.$.status': 'sent', 'messages.$.waId': waId } });
      sent++;
      log.info('CAMPAIGN', `Accepted by Meta for ${mask(m.phone)} (message ${waId}). Delivery result will arrive via webhook`);
    } catch (e) {
      failed++;
      await Campaign.updateOne(where, { $set: { 'messages.$.status': 'failed', 'messages.$.error': e.message } });
      log.error('CAMPAIGN', `Send to ${mask(m.phone)} failed${e.code ? ` (code ${e.code})` : ''}: ${e.message}`);
      if (e.code === 190) {
        await Connection.updateOne({ _id: conn._id }, { status: 'needs_reauth' });
        log.error('CAMPAIGN', 'Token expired or revoked. Stopping and marking the connection "Needs reconnect"');
        state = 'failed'; break;
      }
    }
    await sleep(gap);
  }
  await Campaign.updateOne({ _id: id }, { status: state });
  log.info('CAMPAIGN', `"${c.name}" ${state}: ${sent} accepted by Meta, ${failed} failed`);
  if (sent) log.info('CAMPAIGN', 'If no "Status DELIVERED" lines appear in the next minute, the webhook is not reaching this server');
}

export const create = async (req, res) => {
  const { name, templateName, language } = req.body;
  const variables = (req.body.variables || []).map((v) => String(v).trim());
  if (!name || !templateName || !language) return res.status(400).json({ error: 'Campaign name and an approved template are required' });
  const { conn, token } = await getActive(req.userId);
  const tpl = ((await listTemplates(conn.wabaId, token)).data || []).find((x) => x.name === templateName && x.language === language);
  if (!tpl || tpl.status !== 'APPROVED') {
    log.warn('CAMPAIGN', `Blocked: template ${templateName}/${language} is ${tpl ? tpl.status : 'not found'}`);
    return res.status(400).json({ error: 'This template is not approved yet' });
  }
  const need = new Set(tpl.components?.find((c) => c.type === 'BODY')?.text?.match(/\{\{\d+\}\}/g) || []).size;
  if (variables.length !== need || variables.some((v) => !v)) {
    log.warn('CAMPAIGN', `Blocked: template needs ${need} variable(s), got ${variables.length}`);
    return res.status(400).json({ error: `This template needs ${need} variable value(s)` });
  }
  const contacts = await Contact.find({ user: req.userId, optedIn: true });
  if (!contacts.length) return res.status(400).json({ error: 'Add at least one opted-in contact first' });
  const c = await Campaign.create({
    user: req.userId, name, templateName, language, variables,
    messages: contacts.map((x) => ({ contactName: x.name, phone: x.phone })),
  });
  log.info('CAMPAIGN', `Created "${name}" (${c._id}) for ${contacts.length} contact(s)`);
  run(c._id, conn, token).catch((e) => log.error('CAMPAIGN', 'Run crashed: ' + e.message));
  res.status(201).json({ id: c._id });
};

// Sends the template to ONE number so you can check it before a bulk send.
export const test = async (req, res) => {
  const { templateName, language, phone, variables = [] } = req.body;
  const to = String(phone || '').replace(/\D/g, '');
  if (to.length < 8) return res.status(400).json({ error: 'Enter the test number with country code' });
  const { conn, token } = await getActive(req.userId);
  log.info('TEST', `Sending ${templateName}/${language} to ${mask(to)}`);
  const params = variables.map((v) => String(v).replaceAll('{{name}}', 'there'));
  const r = await sendTemplate(conn.phoneNumberId, token, to, templateName, language, params);
  log.info('TEST', `Accepted by Meta (message ${r.messages?.[0]?.id})`);
  res.json({ id: r.messages?.[0]?.id });
};

export const list = async (req, res) => res.json(await Campaign.find({ user: req.userId }).sort('-createdAt').select('name templateName status createdAt messages.status'));