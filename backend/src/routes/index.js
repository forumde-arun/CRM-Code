
import { Router } from 'express';

import { auth, wrap } from '../middleware/auth.js';

import * as a from '../controllers/authController.js';
import * as cn from '../controllers/connectionController.js';
import * as t from '../controllers/templateController.js';
import * as ct from '../controllers/contactController.js';
import * as cp from '../controllers/campaignController.js';
import * as cg from '../controllers/contactGroupController.js';

const r = Router();
r.get('/connection/config', wrap(cn.config));
// PUBLIC AUTHENTICATION
r.post('/auth/register', wrap(a.register));
r.post('/auth/login', wrap(a.login));
r.post('/auth/google', wrap(a.google));
r.post('/auth/forgot-password', wrap(a.forgotPassword));
r.post('/auth/reset-password', wrap(a.resetPassword));

// ALL ROUTES BELOW REQUIRE AUTHENTICATION
r.use(auth);

// AUTHENTICATION
r.get('/auth/me', wrap(a.me));

// WHATSAPP CONNECTION
r.get('/connection/status', wrap(cn.status));
r.post('/connection/embedded', wrap(cn.connectEmbedded));
r.post('/connection/manual', wrap(cn.connectManual));
r.delete('/connection', wrap(cn.disconnect));

// WHATSAPP TEMPLATES
r.get('/templates', wrap(t.list));
r.post('/templates', wrap(t.create));
r.delete('/templates/:name', wrap(t.remove));

// CONTACTS
r.get('/contacts', wrap(ct.list));
r.post('/contacts', wrap(ct.create));
r.post('/contacts/import', wrap(ct.importMany));
r.patch('/contacts/:id/consent', wrap(ct.updateConsent));
r.delete('/contacts/:id', wrap(ct.remove));

// CONTACT GROUPS
r.get('/contact-groups', wrap(cg.list));
r.post('/contact-groups', wrap(cg.create));
r.get('/contact-groups/:id', wrap(cg.getById));
r.delete('/contact-groups/:id', wrap(cg.remove));

// CAMPAIGNS
r.get('/campaigns', wrap(cp.list));

// All database contacts, including contacts without consent
r.get('/campaigns/contacts', wrap(cp.contacts));

r.post('/campaigns', wrap(cp.create));
r.post('/campaigns/test', wrap(cp.test));

export default r;
