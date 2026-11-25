
import mongoose from 'mongoose';
import Contact from '../models/Contact.js';

// Optional default country code.
// Set DEFAULT_COUNTRY_CODE=91 in backend/.env for India.
const DEFAULT_CC = String(
  process.env.DEFAULT_COUNTRY_CODE || ''
).replace(/\D/g, '');

// Normalize phone numbers.
const norm = (phone) => {
  let digits = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  // Add default country code only to 10-digit numbers.
  if (DEFAULT_CC && digits.length === 10) {
    digits = DEFAULT_CC + digits;
  }

  return digits;
};

const normalizeName = (name) => String(name || '').trim();

// List contacts belonging to the authenticated user.
export const list = async (req, res) => {
  try {
    const contacts = await Contact.find({
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(contacts);
  } catch (error) {
    console.error('[CONTACTS LIST ERROR]', error);

    return res.status(500).json({
      error: 'Failed to load contacts',
      details: error.message,
    });
  }
};

// Create a single contact.
export const create = async (req, res) => {
  try {
    const phone = norm(req.body.phone);
    const name = normalizeName(req.body.name);
    const hasConsent = req.body.consent === true;

    if (phone.length < 8) {
      return res.status(400).json({
        error: 'Enter a valid number with country code.',
      });
    }

    const existing = await Contact.findOne({
      user: req.userId,
      phone,
    });

    if (existing) {
      if (name) existing.name = name;

      // Record consent only when explicitly confirmed.
      if (hasConsent && !existing.optedIn) {
        existing.optedIn = true;
        existing.optedInAt = new Date();
        existing.consentSource =
          'Added in CRM (consent confirmed by account owner)';
      }

      await existing.save();

      return res.json({
        success: true,
        updated: true,
        contact: existing,
        message: 'Existing contact updated.',
      });
    }

    const contact = await Contact.create({
      user: req.userId,
      name,
      phone,
      optedIn: hasConsent,
      optedInAt: hasConsent ? new Date() : null,
      consentSource: hasConsent
        ? 'Added in CRM (consent confirmed by account owner)'
        : '',
    });

    return res.status(201).json({
      success: true,
      added: true,
      contact,
      message: 'Contact added successfully.',
    });
  } catch (error) {
    console.error('[CONTACT CREATE ERROR]', error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'This number already exists in your contacts.',
      });
    }

    return res.status(500).json({
      error: 'Failed to create contact',
      details: error.message,
    });
  }
};

// Import contacts.
// Request body:
// {
//   text: "Name,Phone\nName,Phone",
//   consent: true,
//   consentSource: "Import"
// }
export const importMany = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    const hasConsent = req.body.consent === true;

    const consentSource =
      normalizeName(req.body.consentSource) ||
      'Import (consent confirmed by account owner)';

    const now = new Date();

    const lines = String(req.body.text || '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return res.status(400).json({
        error: 'No import data provided.',
      });
    }

    const parsed = [];
    let invalid = 0;

    for (const line of lines) {
      const parts = line.split(',').map((part) => part.trim());

      const phone = norm(
        parts.length > 1
          ? parts[parts.length - 1]
          : parts[0]
      );

      const name =
        parts.length > 1
          ? normalizeName(parts.slice(0, -1).join(','))
          : '';

      // Ignore common CSV header rows.
      if (
        ['phone', 'mobile', 'number', 'whatsapp'].includes(
          String(parts[parts.length - 1]).toLowerCase()
        )
      ) {
        continue;
      }

      if (phone.length < 8) {
        invalid++;
        continue;
      }

      parsed.push({ phone, name });
    }

    if (!parsed.length) {
      return res.status(400).json({
        error: 'No valid phone numbers found.',
        invalid,
      });
    }

    // Merge duplicate rows by phone.
    const unique = new Map();

    for (const contact of parsed) {
      const previous = unique.get(contact.phone);

      unique.set(contact.phone, {
        phone: contact.phone,
        name: contact.name || previous?.name || '',
      });
    }

    const contacts = [...unique.values()];

    const userId = new mongoose.Types.ObjectId(
      String(req.userId)
    );

    const phones = contacts.map(
      (contact) => contact.phone
    );

    // Identify existing contacts.
    const existingContacts = await Contact.find({
      user: userId,
      phone: { $in: phones },
    })
      .select('phone')
      .lean();

    const existingPhones = new Set(
      existingContacts.map((contact) => contact.phone)
    );

    // Build bulk operations.
    const operations = contacts.map(({ phone, name }) => {
      const update = {
        $setOnInsert: {
          user: userId,
          phone,
          optedIn: hasConsent,
          optedInAt: hasConsent ? now : null,
          consentSource: hasConsent ? consentSource : '',
        },
      };

      // Update existing names without changing consent.
      if (name) {
        update.$set = { name };
      }

      return {
        updateOne: {
          filter: {
            user: userId,
            phone,
          },
          update,
          upsert: true,
        },
      };
    });

    let result;

    try {
      result = await Contact.bulkWrite(operations, {
        ordered: false,
      });
    } catch (error) {
      // Handle concurrent duplicate creation.
      if (error.code !== 11000) {
        throw error;
      }

      console.error(
        '[CONTACT IMPORT DUPLICATE RACE]',
        error.message
      );

      // Re-read contacts after duplicate race.
      const currentContacts = await Contact.find({
        user: userId,
        phone: { $in: phones },
      })
        .select('phone')
        .lean();

      const currentPhones = new Set(
        currentContacts.map((contact) => contact.phone)
      );

      // Retry name updates only.
      // Do not modify consent of existing contacts.
      const retryOperations = contacts
        .filter(
          (contact) =>
            contact.name &&
            currentPhones.has(contact.phone)
        )
        .map(({ phone, name }) => ({
          updateOne: {
            filter: {
              user: userId,
              phone,
            },
            update: {
              $set: { name },
            },
            upsert: false,
          },
        }));

      if (retryOperations.length) {
        result = await Contact.bulkWrite(
          retryOperations,
          { ordered: false }
        );
      } else {
        // Re-read to calculate the final import result.
        result = {
          upsertedCount: 0,
        };
      }
    }

    const added = result.upsertedCount || 0;
    const updated = existingPhones.size;

    return res.json({
      success: true,
      total: contacts.length,
      added,
      updated,
      duplicatesInFile: parsed.length - contacts.length,
      invalid,
      consentRecordedForNewContacts: hasConsent,
      message: `Import completed: ${added} added, ${updated} updated.`,
    });
  } catch (error) {
    console.error('[CONTACT IMPORT ERROR]', error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      error: 'Failed to import contacts',
      details: error.message,
    });
  }
};

// Record or withdraw genuine WhatsApp consent.
export const updateConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { optedIn, consentSource } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid contact ID.',
      });
    }

    if (typeof optedIn !== 'boolean') {
      return res.status(400).json({
        error: 'optedIn must be true or false.',
      });
    }

    const update = optedIn
      ? {
          optedIn: true,
          optedInAt: new Date(),
          consentSource:
            normalizeName(consentSource) ||
            'CRM recorded consent',
        }
      : {
          optedIn: false,
          optedInAt: null,
          consentSource: '',
        };

    const contact = await Contact.findOneAndUpdate(
      {
        _id: id,
        user: req.userId,
      },
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found.',
      });
    }

    return res.json({
      success: true,
      contact,
      message: optedIn
        ? 'Consent recorded successfully.'
        : 'Consent withdrawn successfully.',
    });
  } catch (error) {
    console.error('[CONTACT CONSENT ERROR]', error);

    return res.status(500).json({
      error: 'Failed to update consent',
      details: error.message,
    });
  }
};

// Delete a contact.
export const remove = async (req, res) => {
  try {
    const result = await Contact.deleteOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!result.deletedCount) {
      return res.status(404).json({
        error: 'Contact not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Contact deleted successfully.',
    });
  } catch (error) {
    console.error('[CONTACT DELETE ERROR]', error);

    return res.status(500).json({
      error: 'Failed to delete contact',
      details: error.message,
    });
  }
};
