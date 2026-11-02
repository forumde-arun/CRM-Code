import { Router } from 'express';
import { wrap } from '../middleware/auth.js';
import { verify, receive } from '../controllers/webhookController.js';
const r = Router();
r.get('/', verify);
r.post('/', wrap(receive));
export default r;
