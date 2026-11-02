import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const out = (u) => ({ token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), user: { id: u._id, name: u.name, email: u.email } });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'This email is already registered' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json(out(u));
};

export const login = async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json(out(u));
};
