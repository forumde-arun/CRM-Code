
import mongoose from 'mongoose';

import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import ContactGroup from '../models/ContactGroup.js';
import Connection from '../models/Connection.js';

import { getActive } from './connectionController.js';
import { sendTemplate, listTemplates } from '../services/meta.js';
import { log, mask } from '../utils/logger.js';

// ==========================================
// HELPERS
// ==========================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getUserId = (req) => String(req.userId || '');

class CampaignValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CampaignValidationError';
  }
}

const validateUser = (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new CampaignValidationError(
      'Invalid authenticated user. Please sign in again.'
    );
  }

  return new mongoose.Types.ObjectId(userId);
};

const normalizeIds = (ids) => {
  if (!Array.isArray(ids)) return [];

  return [
    ...new Set(
      ids.map((id) => String(id).trim()).filter(Boolean)
    ),
  ];
};

const getTemplate = (templates, templateName, language) => {
  return (templates?.data || []).find(
    (item) =>
      item.name === templateName &&
      item.language === language
  );
};

const getRequiredVariables = (template) => {
  const bodyText =
    template?.components?.find(
      (component) => component.type === 'BODY'
    )?.text || '';

  return new Set(
    bodyText.match(/\{\{\s*\d+\s*\}\}/g) || []
  ).size;
};

const validateVariables = (variables, required) => {
  if (
    !Array.isArray(variables) ||
    variables.length !== required ||
    variables.some((value) => !String(value).trim())
  ) {
    throw new CampaignValidationError(
      `This template needs ${required} variable value(s).`
    );
  }
};

// ==========================================
// CAMPAIGN CONTACTS
// GET /campaigns/contacts
//
// Returns ALL contacts, including those
// without WhatsApp consent.
// ==========================================

export const contacts = async (req, res) => {
  try {
    const ownerId = validateUser(getUserId(req));

    const [allContacts, total, optedIn, notOptedIn] =
      await Promise.all([
        Contact.find({ user: ownerId })
          .select(
            '_id name phone optedIn optedInAt consentSource createdAt'
          )
          .sort({ createdAt: -1 })
          .lean(),

        Contact.countDocuments({
          user: ownerId,
        }),

        Contact.countDocuments({
          user: ownerId,
          optedIn: true,
        }),

        Contact.countDocuments({
          user: ownerId,
          optedIn: { $ne: true },
        }),
      ]);

    return res.json({
      contacts: allContacts,
      stats: {
        total,
        optedIn,
        notOptedIn,
      },
    });
  } catch (error) {
    log.error(
      'CAMPAIGN',
      `Contact loading failed: ${error.message}`
    );

    if (error instanceof CampaignValidationError) {
      return res.status(401).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to load campaign contacts.',
      details: error.message,
    });
  }
};

// ==========================================
// RESOLVE CAMPAIGN RECIPIENTS
//
// Only opted-in contacts can receive messages.
// ==========================================

async function resolveRecipients(userId, audience = {}) {
  const ownerId = validateUser(userId);
  const type = audience.type || 'all';

  let contactIds = [];

  // ALL OPTED-IN CONTACTS
  if (type === 'all') {
    const contacts = await Contact.find({
      user: ownerId,
      optedIn: true,
    }).select('_id name phone');

    if (!contacts.length) {
      throw new CampaignValidationError(
        'No opted-in contacts found. Record WhatsApp consent before sending.'
      );
    }

    return contacts;
  }

  // SELECTED CONTACTS
  if (type === 'selected') {
    contactIds = normalizeIds(audience.contactIds);

    if (!contactIds.length) {
      throw new CampaignValidationError(
        'Select at least one contact.'
      );
    }

    if (contactIds.length > 5000) {
      throw new CampaignValidationError(
        'You can select a maximum of 5000 contacts.'
      );
    }

    if (!contactIds.every((id) => mongoose.isValidObjectId(id))) {
      throw new CampaignValidationError(
        'One or more selected contact IDs are invalid.'
      );
    }
  }

  // GROUP CONTACTS
  else if (type === 'group') {
    const groupIds = normalizeIds(audience.groupIds);

    if (!groupIds.length) {
      throw new CampaignValidationError(
        'Select at least one contact group.'
      );
    }

    if (groupIds.length > 100) {
      throw new CampaignValidationError(
        'You can select a maximum of 100 groups.'
      );
    }

    if (!groupIds.every((id) => mongoose.isValidObjectId(id))) {
      throw new CampaignValidationError(
        'One or more group IDs are invalid.'
      );
    }

    const groups = await ContactGroup.find({
      _id: { $in: groupIds },
      user: ownerId,
    }).select('contactIds');

    if (groups.length !== groupIds.length) {
      throw new CampaignValidationError(
        'One or more groups do not exist or do not belong to your account.'
      );
    }

    contactIds = [
      ...new Set(
        groups.flatMap((group) =>
          (group.contactIds || []).map(String)
        )
      ),
    ];

    if (!contactIds.length) {
      throw new CampaignValidationError(
        'The selected groups do not contain any contacts.'
      );
    }
  }

  // INVALID AUDIENCE
  else {
    throw new CampaignValidationError(
      'Invalid campaign audience type.'
    );
  }

  // FETCH ONLY OWNED, OPTED-IN CONTACTS
  const contacts = await Contact.find({
    _id: { $in: contactIds },
    user: ownerId,
    optedIn: true,
  }).select('_id name phone');

  if (!contacts.length) {
    const [owned, eligible] = await Promise.all([
      Contact.countDocuments({
        _id: { $in: contactIds },
        user: ownerId,
      }),

      Contact.countDocuments({
        _id: { $in: contactIds },
        user: ownerId,
        optedIn: true,
      }),
    ]);

    throw new CampaignValidationError(
      `No eligible contacts found. Selected: ${contactIds.length}, owned: ${owned}, opted in: ${eligible}.`
    );
  }

  return contacts;
}

// ==========================================
// CAMPAIGN EXECUTION
// ==========================================

async function run(id, conn, token) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new Error(`Campaign ${id} was not found.`);
  }

  const configuredRate = Number(
    process.env.MSG_PER_SECOND || 10
  );

  const rate = Number.isFinite(configuredRate)
    ? Math.max(1, configuredRate)
    : 10;

  const gap = 1000 / rate;

  let sent = 0;
  let failed = 0;
  let stopped = false;

  await Campaign.updateOne(
    { _id: id },
    { $set: { status: 'running' } }
  );

  log.info(
    'CAMPAIGN',
    `"${campaign.name}" starting with ${campaign.messages.length} recipient(s).`
  );

  for (const message of campaign.messages) {
    if (stopped) break;

    const where = {
      _id: id,
      'messages._id': message._id,
    };

    // Check current consent using exact contact ID.
    const currentContact = await Contact.findOne({
      _id: message.contactId,
      user: campaign.user,
      optedIn: true,
    }).select('_id');

    if (!currentContact) {
      failed++;

      await Campaign.updateOne(where, {
        $set: {
          'messages.$.status': 'failed',
          'messages.$.error':
            'Contact consent is missing or has been withdrawn.',
        },
      });

      continue;
    }

    const params = (campaign.variables || []).map(
      (value) =>
        String(value).replaceAll(
          '{{name}}',
          message.contactName || 'there'
        )
    );

    try {
      const result = await sendTemplate(
        conn.phoneNumberId,
        token,
        message.phone,
        campaign.templateName,
        campaign.language,
        params
      );

      const waId = result.messages?.[0]?.id;

      if (!waId) {
        throw new Error(
          'Meta did not return a message ID.'
        );
      }

      await Campaign.updateOne(where, {
        $set: {
          'messages.$.status': 'sent',
          'messages.$.waId': waId,
          'messages.$.error': null,
        },
      });

      sent++;

      log.info(
        'CAMPAIGN',
        `Accepted by Meta for ${mask(message.phone)}.`
      );
    } catch (error) {
      failed++;

      await Campaign.updateOne(where, {
        $set: {
          'messages.$.status': 'failed',
          'messages.$.error': error.message,
        },
      });

      log.error(
        'CAMPAIGN',
        `Send to ${mask(message.phone)} failed: ${error.message}`
      );

      // Meta token expired or revoked.
      if (Number(error.code) === 190) {
        await Connection.updateOne(
          { _id: conn._id },
          { $set: { status: 'needs_reauth' } }
        );

        log.error(
          'CAMPAIGN',
          'Token expired or revoked. Reconnect WhatsApp.'
        );

        stopped = true;
      }
    }

    if (!stopped) {
      await sleep(gap);
    }
  }

  // Mark any remaining queued messages as failed
  // if execution stopped unexpectedly due to token expiry.
  if (stopped) {
    await Campaign.updateOne(
      { _id: id },
      {
        $set: {
          'messages.$[message].status': 'failed',
          'messages.$[message].error':
            'Campaign stopped because WhatsApp authentication needs reconnecting.',
        },
      },
      {
        arrayFilters: [
          { 'message.status': 'queued' },
        ],
      }
    );
  }

  const status =
    failed > 0 && sent === 0
      ? 'failed'
      : 'completed';

  await Campaign.updateOne(
    { _id: id },
    { $set: { status } }
  );

  log.info(
    'CAMPAIGN',
    `"${campaign.name}" ${status}: ${sent} accepted by Meta, ${failed} failed.`
  );

  if (sent > 0) {
    log.info(
      'CAMPAIGN',
      'Message acceptance is not delivery confirmation. Delivery status is updated by the WhatsApp webhook.'
    );
  }
}

// ==========================================
// CREATE CAMPAIGN
// POST /campaigns
// ==========================================

export const create = async (req, res) => {
  try {
    const {
      name,
      templateName,
      language,
    } = req.body;

    const variables = Array.isArray(req.body.variables)
      ? req.body.variables.map((value) => String(value).trim())
      : [];

    const audience = req.body.audience || {
      type: 'all',
    };

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof templateName !== 'string' ||
      !templateName.trim() ||
      typeof language !== 'string' ||
      !language.trim()
    ) {
      return res.status(400).json({
        error: 'Campaign name and an approved template are required.',
      });
    }

    const userId = getUserId(req);
    const ownerId = validateUser(userId);

    // Resolve eligible recipients first.
    const recipients = await resolveRecipients(
      userId,
      audience
    );

    // Get connected WhatsApp account.
    const { conn, token } = await getActive(userId);

    // Verify template approval.
    const templates = await listTemplates(
      conn.wabaId,
      token
    );

    const template = getTemplate(
      templates,
      templateName,
      language
    );

    if (!template || template.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'This template is not approved yet.',
      });
    }

    const requiredVariables = getRequiredVariables(template);

    validateVariables(variables, requiredVariables);

    // Create campaign with exact contact IDs.
    const campaign = await Campaign.create({
      user: ownerId,
      name: name.trim(),
      templateName: templateName.trim(),
      language: language.trim(),
      variables,
      audienceType: audience.type || 'all',

      selectedGroupIds:
        audience.type === 'group'
          ? normalizeIds(audience.groupIds)
          : [],

      messages: recipients.map((contact) => ({
        contactId: contact._id,
        contactName: contact.name,
        phone: contact.phone,
        status: 'queued',
      })),
    });

    log.info(
      'CAMPAIGN',
      `Created "${campaign.name}" (${campaign._id}) for ${recipients.length} recipient(s).`
    );

    // Start campaign in background.
    run(campaign._id, conn, token).catch(
      async (error) => {
        log.error(
          'CAMPAIGN',
          `Execution crashed for ${campaign._id}: ${error.message}`
        );

        await Campaign.updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: 'failed',
              'messages.$[message].status': 'failed',
              'messages.$[message].error':
                'Campaign execution stopped unexpectedly.',
            },
          },
          {
            arrayFilters: [
              { 'message.status': 'queued' },
            ],
          }
        ).catch((updateError) => {
          log.error(
            'CAMPAIGN',
            `Could not update failed campaign: ${updateError.message}`
          );
        });
      }
    );

    return res.status(201).json({
      id: campaign._id,
      recipientCount: recipients.length,
      audienceType: audience.type || 'all',
    });
  } catch (error) {
    log.error(
      'CAMPAIGN',
      `Creation failed: ${error.message}`
    );

    if (error instanceof CampaignValidationError) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create campaign.',
      details: error.message,
    });
  }
};

// ==========================================
// TEST CAMPAIGN MESSAGE
// POST /campaigns/test
// ==========================================

export const test = async (req, res) => {
  try {
    const {
      templateName,
      language,
      phone,
      variables = [],
    } = req.body;

    const to = String(phone || '').replace(/\D/g, '');

    if (to.length < 8 || to.length > 15) {
      return res.status(400).json({
        error: 'Enter a valid test number with country code.',
      });
    }

    if (!templateName || !language) {
      return res.status(400).json({
        error: 'Template name and language are required.',
      });
    }

    if (!Array.isArray(variables)) {
      return res.status(400).json({
        error: 'Template variables must be an array.',
      });
    }

    const { conn, token } = await getActive(
      getUserId(req)
    );

    const templates = await listTemplates(
      conn.wabaId,
      token
    );

    const template = getTemplate(
      templates,
      templateName,
      language
    );

    if (!template || template.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'This template is not approved.',
      });
    }

    const requiredVariables = getRequiredVariables(template);

    validateVariables(variables, requiredVariables);

    const params = variables.map((value) =>
      String(value).replaceAll('{{name}}', 'there')
    );

    const result = await sendTemplate(
      conn.phoneNumberId,
      token,
      to,
      templateName,
      language,
      params
    );

    const waId = result.messages?.[0]?.id;

    log.info(
      'TEST',
      `Test message accepted by Meta for ${mask(to)}.`
    );

    return res.json({
      id: waId,
    });
  } catch (error) {
    log.error(
      'TEST',
      `Test message failed: ${error.message}`
    );

    if (error instanceof CampaignValidationError) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to send test message.',
      details: error.message,
    });
  }
};

// ==========================================
// CAMPAIGN HISTORY
// GET /campaigns
// ==========================================

export const list = async (req, res) => {
  try {
    const ownerId = validateUser(getUserId(req));

    const campaigns = await Campaign.find({
      user: ownerId,
    })
      .sort({ createdAt: -1 })
      .select(
        'name templateName status createdAt messages.status audienceType'
      )
      .lean();

    return res.json(campaigns);
  } catch (error) {
    log.error(
      'CAMPAIGN',
      `Campaign list failed: ${error.message}`
    );

    if (error instanceof CampaignValidationError) {
      return res.status(401).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to load campaigns.',
      details: error.message,
    });
  }
};
