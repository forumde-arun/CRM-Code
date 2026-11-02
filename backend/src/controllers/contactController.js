import Contact from '../models/Contact.js';

const norm = (p) => String(p || '').replace(/\D/g, '');

export const list = async (req, res) => res.json(await Contact.find({ user: req.userId }).sort('-createdAt'));

export const create = async (req, res) => {
  const phone = norm(req.body.phone);
  if (phone.length < 8) return res.status(400).json({ error: 'Enter the number with country code, e.g. 919876543210' });
  try {
    res.status(201).json(await Contact.create({ user: req.userId, name: (req.body.name || '').trim(), phone }));
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'This number is already in your contacts' });
    throw e;
  }
};

// Body: { text } with one "name,phone" or "phone" per line. Only import people who opted in.
export const importMany = async (req, res) => {
  const ops = String(req.body.text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const parts = l.split(',').map((x) => x.trim());
    const phone = norm(parts.length > 1 ? parts[parts.length - 1] : parts[0]);
    const name = parts.length > 1 ? parts[0] : '';
    return { phone, name };
  }).filter((x) => x.phone.length >= 8).map(({ phone, name }) => ({
    updateOne: { filter: { user: req.userId, phone }, update: { $setOnInsert: { user: req.userId, phone, name, optedIn: true } }, upsert: true },
  }));
  if (!ops.length) return res.status(400).json({ error: 'No valid numbers found. Use "name,phone" per line, with country code.' });
  const r = await Contact.bulkWrite(ops);
  res.json({ added: r.upsertedCount, skipped: ops.length - r.upsertedCount });
};

export const remove = async (req, res) => {
  await Contact.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
};
