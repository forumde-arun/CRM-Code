
import mongoose from 'mongoose';

import Contact from '../models/Contact.js';
import ContactGroup from '../models/ContactGroup.js';

// ============================================
// GET ALL GROUPS
// ============================================

export const list = async (req, res) => {
  const groups = await ContactGroup.find({
    user: req.userId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  const result = groups.map((group) => ({
    ...group,
    contactCount: group.contactIds.length,
  }));

  return res.json(result);
};

// ============================================
// CREATE GROUP
// ============================================

export const create = async (req, res) => {
  const name = String(req.body.name || '').trim();

  const contactIds = Array.isArray(req.body.contactIds)
    ? [...new Set(req.body.contactIds.map(String))]
    : [];

  if (!name) {
    return res.status(400).json({
      error: 'Group name is required.',
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      error: 'Group name cannot exceed 100 characters.',
    });
  }

  if (!contactIds.length) {
    return res.status(400).json({
      error: 'Select at least one contact to create a group.',
    });
  }

  if (contactIds.length > 5000) {
    return res.status(400).json({
      error: 'A group cannot contain more than 5000 contacts.',
    });
  }

  const invalidIds = contactIds.filter(
    (id) => !mongoose.isValidObjectId(id)
  );

  if (invalidIds.length) {
    return res.status(400).json({
      error: 'One or more contact IDs are invalid.',
    });
  }

  // Verify that every contact belongs to the logged-in user.
  const contacts = await Contact.find({
    _id: { $in: contactIds },
    user: req.userId,
  }).select('_id');

  if (contacts.length !== contactIds.length) {
    return res.status(400).json({
      error: 'Some selected contacts do not exist or do not belong to your account.',
    });
  }

  try {
    const group = await ContactGroup.create({
      user: req.userId,
      name,
      contactIds: contacts.map((contact) => contact._id),
    });

    return res.status(201).json({
      message: 'Contact group created successfully.',
      group: {
        ...group.toObject(),
        contactCount: group.contactIds.length,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A group with this name already exists.',
      });
    }

    throw error;
  }
};

// ============================================
// GET GROUP DETAILS
// ============================================

export const getById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      error: 'Invalid group ID.',
    });
  }

  const group = await ContactGroup.findOne({
    _id: id,
    user: req.userId,
  }).lean();

  if (!group) {
    return res.status(404).json({
      error: 'Contact group not found.',
    });
  }

  const contacts = await Contact.find({
    _id: { $in: group.contactIds },
    user: req.userId,
  }).lean();

  return res.json({
    ...group,
    contacts,
    contactCount: contacts.length,
  });
};

// ============================================
// DELETE GROUP
// ============================================

export const remove = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      error: 'Invalid group ID.',
    });
  }

  const group = await ContactGroup.findOneAndDelete({
    _id: id,
    user: req.userId,
  });

  if (!group) {
    return res.status(404).json({
      error: 'Contact group not found.',
    });
  }

  // Deleting a group does not delete its contacts.
  return res.json({
    message: 'Contact group deleted successfully.',
  });
};
