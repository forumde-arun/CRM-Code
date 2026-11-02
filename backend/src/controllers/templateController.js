import { getActive } from './connectionController.js';
import { listTemplates, createTemplate, deleteTemplate } from '../services/meta.js';

const bad = (message) => Object.assign(new Error(message), { status: 400 });
const nums = (t = '') => [...new Set((t.match(/\{\{\d+\}\}/g) || []).map((x) => Number(x.replace(/\D/g, ''))))].sort((a, b) => a - b);

export const list = async (req, res) => {
  const { conn, token } = await getActive(req.userId);
  const r = await listTemplates(conn.wabaId, token);
  res.json(r.data || []);
};

export const create = async (req, res) => {
  const { name, category, language, header, text, footer, buttons = [], samples = [] } = req.body;
  if (!/^[a-z0-9_]{1,512}$/.test(name || '')) throw bad('Name can only use lowercase letters, numbers and underscores');
  if (!['MARKETING', 'UTILITY'].includes(category) || !language || !text) throw bad('Category, language and message text are required');
  if (text.length > 1024) throw bad('Message text can be at most 1024 characters');
  const n = nums(text);
  if (n.some((v, i) => v !== i + 1)) throw bad('Variables must be numbered in order: {{1}}, {{2}}, {{3}}');
  if (/^\s*\{\{\d+\}\}/.test(text) || /\{\{\d+\}\}\s*$/.test(text)) throw bad('Message text cannot start or end with a variable. Add words before and after it.');
  if (samples.length !== n.length || samples.some((s) => !String(s).trim())) throw bad('Enter a sample value for every variable');
  if (header && (header.length > 60 || /\{\{/.test(header))) throw bad('Header can be at most 60 characters and cannot contain variables');
  if (footer && (footer.length > 60 || /\{\{/.test(footer))) throw bad('Footer can be at most 60 characters and cannot contain variables');
  if (buttons.length > 3) throw bad('Maximum 3 buttons');
  const btns = buttons.map((b) => {
    if (!b.text || b.text.length > 25) throw bad('Every button needs text of 25 characters or less');
    if (b.type === 'URL') {
      if (!/^https:\/\//.test(b.url || '')) throw bad('Button link must start with https://');
      return { type: 'URL', text: b.text, url: b.url };
    }
    return { type: 'QUICK_REPLY', text: b.text };
  });
  const components = [
    ...(header ? [{ type: 'HEADER', format: 'TEXT', text: header }] : []),
    { type: 'BODY', text, ...(n.length && { example: { body_text: [samples.map(String)] } }) },
    ...(footer ? [{ type: 'FOOTER', text: footer }] : []),
    ...(btns.length ? [{ type: 'BUTTONS', buttons: btns }] : []),
  ];
  const { conn, token } = await getActive(req.userId);
  res.status(201).json(await createTemplate(conn.wabaId, token, { name, category, language, components }));
};

export const remove = async (req, res) => {
  const { conn, token } = await getActive(req.userId);
  await deleteTemplate(conn.wabaId, token, req.params.name);
  res.json({ ok: true });
};