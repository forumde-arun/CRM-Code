
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

import { api } from '@/lib/api';

// ============================================
// HELPERS
// ============================================

export const windowOpen = (contact) =>
  contact.lastInboundAt &&
  Date.now() - new Date(contact.lastInboundAt).getTime() < 864e5;

const normalizePhone = (value) =>
  String(value || '').replace(/\D/g, '');

const normalizeHeader = (value) =>
  String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const getContactFields = (row) => {
  const values = {};

  Object.entries(row).forEach(([key, value]) => {
    values[normalizeHeader(key)] = value;
  });

  const name =
    values.name ||
    values.fullname ||
    values.contactname ||
    values.firstname ||
    '';

  const phone =
    values.phone ||
    values.phonenumber ||
    values.mobile ||
    values.mobilenumber ||
    values.whatsapp ||
    values.whatsappnumber ||
    '';

  return {
    name: String(name).trim(),
    phone: normalizePhone(phone),
  };
};

// ============================================
// HOOK
// ============================================

export default function useContacts() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);

  const [f, setF] = useState({
    name: '',
    phone: '',
  });

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const [fileContacts, setFileContacts] = useState([]);
  const [fileName, setFileName] = useState('');

  const [groupName, setGroupName] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);

  const [activeTab, setActiveTab] = useState('contacts');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // ============================================
  // WHATSAPP CONSENT STATE
  // ============================================

  const [consent, setConsent] = useState(false);

  // ============================================
  // LOAD CONTACTS
  // ============================================

  const load = useCallback(async () => {
    try {
      const response = await api.get('/contacts');

      setRows(
        Array.isArray(response)
          ? response
          : response.contacts || []
      );
    } catch (err) {
      setError(err.message || 'Unable to load contacts.');
    }
  }, []);

  // ============================================
  // LOAD GROUPS
  // ============================================

  const loadGroups = useCallback(async () => {
    try {
      const response = await api.get('/contact-groups');

      setGroups(
        Array.isArray(response)
          ? response
          : response.groups || []
      );
    } catch (err) {
      console.warn(
        'Groups API is not available yet:',
        err.message
      );
    }
  }, []);

  useEffect(() => {
    load();
    loadGroups();
  }, [load, loadGroups]);

  // ============================================
  // FILTER CONTACTS
  // ============================================

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((contact) => {
      const matchesSearch =
        !query ||
        String(contact.name || '').toLowerCase().includes(query) ||
        String(contact.phone || '').toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'opted-in' && contact.optedIn) ||
        (filter === 'opted-out' && !contact.optedIn) ||
        (filter === 'window-open' && windowOpen(contact)) ||
        (filter === 'window-closed' && !windowOpen(contact));

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const selectedContacts = useMemo(
    () => rows.filter((contact) => selectedIds.includes(contact._id)),
    [rows, selectedIds]
  );

  const selectedCount = selectedIds.length;

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((contact) =>
      selectedIds.includes(contact._id)
    );

  // ============================================
  // ADD CONTACT
  // ============================================

  const add = async (e) => {
    e.preventDefault();

    setMsg('');
    setError('');

    try {
      await api.post('/contacts', {
        name: f.name.trim(),
        phone: normalizePhone(f.phone),
        consent,
      });

      setF({
        name: '',
        phone: '',
      });

      setConsent(false);

      setMsg(
        consent
          ? 'Contact added successfully. Consent recorded.'
          : 'Contact added successfully. WhatsApp consent not recorded.'
      );

      await load();
    } catch (err) {
      setError(err.message || 'Unable to add contact.');
    }
  };

  // ============================================
  // RECORD / WITHDRAW CONTACT CONSENT
  // ============================================

  const setContactConsent = async (contact, optedIn) => {
    if (!contact?._id) return;

    if (
      optedIn &&
      !window.confirm(
        `Confirm that ${contact.name || contact.phone} has genuinely agreed to receive WhatsApp messages from your business.`
      )
    ) {
      return;
    }

    setError('');
    setMsg('');

    try {
      await api.patch(
        `/contacts/${contact._id}/consent`,
        {
          optedIn,
          consentSource: 'Consent recorded in CRM',
        }
      );

      setMsg(
        optedIn
          ? 'WhatsApp consent recorded successfully.'
          : 'WhatsApp consent withdrawn successfully.'
      );

      await load();
    } catch (err) {
      setError(
        err.message || 'Unable to update contact consent.'
      );
    }
  };

  // ============================================
  // SELECT CONTACTS
  // ============================================

  const toggleContact = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredRows.map(
        (contact) => contact._id
      );

      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedIds((previous) => [
        ...new Set([
          ...previous,
          ...filteredRows.map((contact) => contact._id),
        ]),
      ]);
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // ============================================
  // DELETE ONE CONTACT
  // ============================================

  const removeContact = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this contact?'
      )
    ) {
      return;
    }

    setError('');
    setMsg('');

    try {
      await api.del('/contacts/' + id);

      setSelectedIds((previous) =>
        previous.filter((item) => item !== id)
      );

      setMsg('Contact deleted successfully.');

      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete contact.');
    }
  };

  // ============================================
  // BULK DELETE
  // ============================================

  const deleteSelected = async () => {
    if (!selectedIds.length) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected contacts? This action cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError('');
    setMsg('');

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          api.del('/contacts/' + id)
        )
      );

      const successful = results.filter(
        (result) => result.status === 'fulfilled'
      ).length;

      const failed = results.length - successful;

      setSelectedIds([]);

      setMsg(
        `${successful} contacts deleted successfully.` +
        (failed ? ` ${failed} could not be deleted.` : '')
      );

      await load();
    } catch (err) {
      setError(
        err.message || 'Unable to delete selected contacts.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // MANUAL BULK IMPORT
  // ============================================

  const importAll = async () => {
    if (!text.trim()) return;

    setBusy(true);
    setMsg('');
    setError('');

    try {
      const response = await api.post('/contacts/import', {
        text,
        consent,
        consentSource: 'Manual bulk import',
      });

      setMsg(
        `Import completed: ${response.added || 0} added, ` +
        `${response.updated || 0} existing contacts updated. ` +
        `${response.invalid || 0} invalid rows.`
      );

      setText('');
      setConsent(false);

      await load();
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // CSV / EXCEL FILE READER
  // ============================================

  const handleFile = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError('');
    setMsg('');
    setFileName(file.name);
    setFileContacts([]);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: 'array',
      });

      const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

      const rawRows = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
      });

      const parsed = rawRows
        .map(getContactFields)
        .filter((contact) => contact.phone.length >= 8);

      const unique = new Map();

      parsed.forEach((contact) => {
        if (!unique.has(contact.phone)) {
          unique.set(contact.phone, contact);
        }
      });

      const contacts = [...unique.values()];

      if (!contacts.length) {
        throw new Error(
          'No valid phone numbers found. Check your file column names.'
        );
      }

      setFileContacts(contacts);

      setMsg(
        `File loaded successfully. ${contacts.length} unique contacts found.`
      );
    } catch (err) {
      setError(err.message || 'Unable to read this file.');
      setFileContacts([]);
    }

    // Allow selecting the same file again.
    e.target.value = '';
  };

  // ============================================
  // IMPORT FILE CONTACTS
  // ============================================

  const importFileContacts = async () => {
    if (!fileContacts.length) return;

    setBusy(true);
    setError('');
    setMsg('');

    try {
      const importText = fileContacts
        .map(
          (contact) =>
            `${contact.name},${contact.phone}`
        )
        .join('\n');

      const response = await api.post('/contacts/import', {
        text: importText,
        consent,
        consentSource: 'CSV/Excel file import',
      });

      setMsg(
        `File import completed: ${response.added || 0} added, ` +
        `${response.updated || 0} existing contacts updated. ` +
        `${response.invalid || 0} invalid rows.`
      );

      setFileContacts([]);
      setFileName('');
      setConsent(false);

      await load();
    } catch (err) {
      setError(
        err.message || 'Unable to import file contacts.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // CREATE GROUP FROM SELECTED CONTACTS
  // ============================================

  const createGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || !selectedIds.length) return;

    setBusy(true);
    setError('');
    setMsg('');

    try {
      await api.post('/contact-groups', {
        name: groupName.trim(),
        contactIds: selectedIds,
      });

      setGroupName('');
      setShowGroupForm(false);
      setSelectedIds([]);

      setMsg('Group created successfully.');

      await loadGroups();
    } catch (err) {
      setError(
        err.message ||
        'Unable to create group. Group backend API may not be implemented yet.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // SEND SELECTED CONTACTS TO CAMPAIGNS
  // ============================================

  const sendToCampaign = () => {
    if (!selectedIds.length) return;

    const ids = encodeURIComponent(
      selectedIds.join(',')
    );

    router.push(`/campaigns?contactIds=${ids}`);
  };

  const sendGroupToCampaign = (groupId) => {
    router.push(
      `/campaigns?groupId=${encodeURIComponent(groupId)}`
    );
  };

  // ============================================
  // SUMMARY COUNTS
  // ============================================

  const optedInCount = rows.filter(
    (contact) => contact.optedIn
  ).length;

  const openWindowCount = rows.filter(windowOpen).length;

  // ============================================
  // RETURN
  // ============================================

  return {
    // refs
    fileRef,

    // data
    rows,
    groups,
    filteredRows,
    selectedContacts,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    fileContacts,
    fileName,

    // form / input state
    f,
    setF,
    text,
    setText,
    search,
    setSearch,
    filter,
    setFilter,
    groupName,
    setGroupName,
    showGroupForm,
    setShowGroupForm,

    // consent state
    consent,
    setConsent,

    // ui state
    activeTab,
    setActiveTab,
    msg,
    error,
    busy,

    // summary counts
    optedInCount,
    openWindowCount,

    // handlers
    add,
    setContactConsent,
    toggleContact,
    toggleAll,
    clearSelection,
    removeContact,
    deleteSelected,
    importAll,
    handleFile,
    importFileContacts,
    createGroup,
    sendToCampaign,
    sendGroupToCampaign,

    // refresh
    load,
    loadGroups,
  };
}
