import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Local: read backend/.env. Deployed on Cloud Run: values come from real environment variables.
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
if (fs.existsSync(file)) dotenv.config({ path: file });

const missing = ['MONGO_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'].filter((k) => !process.env[k]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
  throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (no quotes or spaces)');
}