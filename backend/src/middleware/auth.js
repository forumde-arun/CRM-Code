import jwt from 'jsonwebtoken';
export const auth = (req, res, next) => {
  try {
    req.userId = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in again' });
  }
};
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
