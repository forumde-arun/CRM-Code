
// 'use client';

// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import * as XLSX from 'xlsx';

// import { api } from '@/lib/api';
// import { Alert, Badge, Empty, PageHeader } from '@/components/ui';

// const windowOpen = (contact) =>
//   contact.lastInboundAt &&
//   Date.now() - new Date(contact.lastInboundAt).getTime() < 864e5;

// const normalizePhone = (value) =>
//   String(value || '').replace(/\D/g, '');

// const normalizeHeader = (value) =>
//   String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

// const getContactFields = (row) => {
//   const values = {};

//   Object.entries(row).forEach(([key, value]) => {
//     values[normalizeHeader(key)] = value;
//   });

//   const name =
//     values.name ||
//     values.fullname ||
//     values.contactname ||
//     values.firstname ||
//     '';

//   const phone =
//     values.phone ||
//     values.phonenumber ||
//     values.mobile ||
//     values.mobilenumber ||
//     values.whatsapp ||
//     values.whatsappnumber ||
//     '';

//   return {
//     name: String(name).trim(),
//     phone: normalizePhone(phone),
//   };
// };

// export default function ContactsView() {
//   const router = useRouter();
//   const fileRef = useRef(null);

//   const [rows, setRows] = useState([]);
//   const [groups, setGroups] = useState([]);

//   const [f, setF] = useState({
//     name: '',
//     phone: '',
//   });

//   const [text, setText] = useState('');
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState('all');
//   const [selectedIds, setSelectedIds] = useState([]);

//   const [fileContacts, setFileContacts] = useState([]);
//   const [fileName, setFileName] = useState('');

//   const [groupName, setGroupName] = useState('');
//   const [showGroupForm, setShowGroupForm] = useState(false);

//   const [activeTab, setActiveTab] = useState('contacts');
//   const [msg, setMsg] = useState('');
//   const [error, setError] = useState('');
//   const [busy, setBusy] = useState(false);

//   // ============================================
//   // LOAD CONTACTS
//   // ============================================

//   const load = useCallback(async () => {
//     try {
//       const response = await api.get('/contacts');

//       setRows(
//         Array.isArray(response)
//           ? response
//           : response.contacts || []
//       );
//     } catch (err) {
//       setError(err.message || 'Unable to load contacts.');
//     }
//   }, []);

//   // ============================================
//   // LOAD GROUPS
//   // ============================================

//   const loadGroups = useCallback(async () => {
//     try {
//       const response = await api.get('/contact-groups');

//       setGroups(
//         Array.isArray(response)
//           ? response
//           : response.groups || []
//       );
//     } catch (err) {
//       console.warn('Groups API is not available yet:', err.message);
//     }
//   }, []);

//   useEffect(() => {
//     load();
//     loadGroups();
//   }, [load, loadGroups]);

//   // ============================================
//   // FILTER CONTACTS
//   // ============================================

//   const filteredRows = useMemo(() => {
//     const query = search.trim().toLowerCase();

//     return rows.filter((contact) => {
//       const matchesSearch =
//         !query ||
//         String(contact.name || '').toLowerCase().includes(query) ||
//         String(contact.phone || '').toLowerCase().includes(query);

//       const matchesFilter =
//         filter === 'all' ||
//         (filter === 'opted-in' && contact.optedIn) ||
//         (filter === 'opted-out' && !contact.optedIn) ||
//         (filter === 'window-open' && windowOpen(contact)) ||
//         (filter === 'window-closed' && !windowOpen(contact));

//       return matchesSearch && matchesFilter;
//     });
//   }, [rows, search, filter]);

//   const selectedContacts = useMemo(
//     () => rows.filter((contact) => selectedIds.includes(contact._id)),
//     [rows, selectedIds]
//   );

//   const selectedCount = selectedIds.length;

//   const allVisibleSelected =
//     filteredRows.length > 0 &&
//     filteredRows.every((contact) => selectedIds.includes(contact._id));

//   // ============================================
//   // ADD CONTACT
//   // ============================================

//   const add = async (e) => {
//     e.preventDefault();

//     setMsg('');
//     setError('');

//     try {
//       await api.post('/contacts', {
//         name: f.name.trim(),
//         phone: normalizePhone(f.phone),
//       });

//       setF({ name: '', phone: '' });
//       setMsg('Contact added successfully.');

//       await load();
//     } catch (err) {
//       setError(err.message || 'Unable to add contact.');
//     }
//   };

//   // ============================================
//   // SELECT CONTACTS
//   // ============================================

//   const toggleContact = (id) => {
//     setSelectedIds((previous) =>
//       previous.includes(id)
//         ? previous.filter((item) => item !== id)
//         : [...previous, id]
//     );
//   };

//   const toggleAll = () => {
//     if (allVisibleSelected) {
//       const visibleIds = filteredRows.map((contact) => contact._id);

//       setSelectedIds((previous) =>
//         previous.filter((id) => !visibleIds.includes(id))
//       );
//     } else {
//       setSelectedIds((previous) => [
//         ...new Set([
//           ...previous,
//           ...filteredRows.map((contact) => contact._id),
//         ]),
//       ]);
//     }
//   };

//   // ============================================
//   // DELETE ONE CONTACT
//   // ============================================

//   const removeContact = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this contact?')) {
//       return;
//     }

//     setError('');
//     setMsg('');

//     try {
//       await api.del('/contacts/' + id);

//       setSelectedIds((previous) =>
//         previous.filter((item) => item !== id)
//       );

//       setMsg('Contact deleted successfully.');

//       await load();
//     } catch (err) {
//       setError(err.message || 'Unable to delete contact.');
//     }
//   };

//   // ============================================
//   // BULK DELETE
//   // ============================================

//   const deleteSelected = async () => {
//     if (!selectedIds.length) return;

//     const confirmed = window.confirm(
//       `Delete ${selectedIds.length} selected contacts? This action cannot be undone.`
//     );

//     if (!confirmed) return;

//     setBusy(true);
//     setError('');
//     setMsg('');

//     try {
//       const results = await Promise.allSettled(
//         selectedIds.map((id) => api.del('/contacts/' + id))
//       );

//       const successful = results.filter(
//         (result) => result.status === 'fulfilled'
//       ).length;

//       const failed = results.length - successful;

//       setSelectedIds([]);

//       setMsg(
//         `${successful} contacts deleted successfully.` +
//         (failed ? ` ${failed} could not be deleted.` : '')
//       );

//       await load();
//     } catch (err) {
//       setError(err.message || 'Unable to delete selected contacts.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   // ============================================
//   // MANUAL BULK IMPORT
//   // ============================================

//   const importAll = async () => {
//     if (!text.trim()) return;

//     setBusy(true);
//     setMsg('');
//     setError('');

//     try {
//       const response = await api.post('/contacts/import', {
//         text,
//       });

//       setMsg(
//         `Added ${response.added || 0}, skipped ${response.skipped || 0} existing contacts.`
//       );

//       setText('');
//       await load();
//     } catch (err) {
//       setError(err.message || 'Import failed.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   // ============================================
//   // CSV / EXCEL FILE READER
//   // ============================================

//   const handleFile = async (e) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     setError('');
//     setMsg('');
//     setFileName(file.name);
//     setFileContacts([]);

//     try {
//       const buffer = await file.arrayBuffer();

//       const workbook = XLSX.read(buffer, {
//         type: 'array',
//       });

//       const sheet = workbook.Sheets[workbook.SheetNames[0]];

//       const rawRows = XLSX.utils.sheet_to_json(sheet, {
//         defval: '',
//       });

//       const parsed = rawRows
//         .map(getContactFields)
//         .filter((contact) => contact.phone.length >= 8);

//       const unique = new Map();

//       parsed.forEach((contact) => {
//         if (!unique.has(contact.phone)) {
//           unique.set(contact.phone, contact);
//         }
//       });

//       const contacts = [...unique.values()];

//       if (!contacts.length) {
//         throw new Error(
//           'No valid phone numbers found. Check your file column names.'
//         );
//       }

//       setFileContacts(contacts);

//       setMsg(
//         `File loaded successfully. ${contacts.length} unique contacts found.`
//       );
//     } catch (err) {
//       setError(err.message || 'Unable to read this file.');
//       setFileContacts([]);
//     }

//     // Allow selecting the same file again.
//     e.target.value = '';
//   };

//   // ============================================
//   // IMPORT FILE CONTACTS
//   // ============================================

//   const importFileContacts = async () => {
//     if (!fileContacts.length) return;

//     setBusy(true);
//     setError('');
//     setMsg('');

//     try {
//       const importText = fileContacts
//         .map((contact) => `${contact.name},${contact.phone}`)
//         .join('\n');

//       const response = await api.post('/contacts/import', {
//         text: importText,
//       });

//       setMsg(
//         `File import complete. Added ${response.added || 0}, skipped ${response.skipped || 0}.`
//       );

//       setFileContacts([]);
//       setFileName('');

//       await load();
//     } catch (err) {
//       setError(err.message || 'Unable to import file contacts.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   // ============================================
//   // CREATE GROUP FROM SELECTED CONTACTS
//   // ============================================

//   const createGroup = async (e) => {
//     e.preventDefault();

//     if (!groupName.trim() || !selectedIds.length) return;

//     setBusy(true);
//     setError('');
//     setMsg('');

//     try {
//       await api.post('/contact-groups', {
//         name: groupName.trim(),
//         contactIds: selectedIds,
//       });

//       setGroupName('');
//       setShowGroupForm(false);
//       setSelectedIds([]);

//       setMsg('Group created successfully.');

//       await loadGroups();
//     } catch (err) {
//       setError(
//         err.message ||
//         'Unable to create group. Group backend API may not be implemented yet.'
//       );
//     } finally {
//       setBusy(false);
//     }
//   };

//   // ============================================
//   // SEND SELECTED CONTACTS TO CAMPAIGNS
//   // ============================================

//   const sendToCampaign = () => {
//     if (!selectedIds.length) return;

//     const ids = encodeURIComponent(selectedIds.join(','));

//     router.push(`/campaigns?contactIds=${ids}`);
//   };

//   const sendGroupToCampaign = (groupId) => {
//     router.push(`/campaigns?groupId=${encodeURIComponent(groupId)}`);
//   };

//   // ============================================
//   // SUMMARY COUNTS
//   // ============================================

//   const optedInCount = rows.filter((contact) => contact.optedIn).length;

//   const openWindowCount = rows.filter(windowOpen).length;

//   return (
//     <div className="space-y-7">

//       <PageHeader
//         title="Contacts & Audiences"
//         desc="Manage contacts, import CSV or Excel files, organize groups and select audiences for WhatsApp campaigns."
//       />

//       {msg && <Alert>{msg}</Alert>}

//       {error && <Alert>{error}</Alert>}

//       {/* ========================================
//           SUMMARY CARDS
//       ======================================== */}

//       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

//         <div className="card">
//           <p className="text-sm text-slate-500">Total contacts</p>
//           <p className="mt-2 text-3xl font-bold text-slate-900">
//             {rows.length}
//           </p>
//           <p className="mt-1 text-xs text-slate-500">
//             Saved in your CRM
//           </p>
//         </div>

//         <div className="card">
//           <p className="text-sm text-slate-500">Contact groups</p>
//           <p className="mt-2 text-3xl font-bold text-slate-900">
//             {groups.length}
//           </p>
//           <p className="mt-1 text-xs text-slate-500">
//             Reusable audiences
//           </p>
//         </div>

//         <div className="card">
//           <p className="text-sm text-slate-500">Opted-in contacts</p>
//           <p className="mt-2 text-3xl font-bold text-emerald-600">
//             {optedInCount}
//           </p>
//           <p className="mt-1 text-xs text-slate-500">
//             Permission to receive messages
//           </p>
//         </div>

//         <div className="card">
//           <p className="text-sm text-slate-500">Open reply windows</p>
//           <p className="mt-2 text-3xl font-bold text-slate-900">
//             {openWindowCount}
//           </p>
//           <p className="mt-1 text-xs text-slate-500">
//             Last inbound message within 24 hours
//           </p>
//         </div>

//       </div>

//       {/* ========================================
//           TABS
//       ======================================== */}

//       <div className="flex flex-wrap gap-2 border-b border-slate-200">

//         <button
//           type="button"
//           onClick={() => setActiveTab('contacts')}
//           className={`border-b-2 px-4 py-3 text-sm font-medium ${
//             activeTab === 'contacts'
//               ? 'border-emerald-600 text-emerald-700'
//               : 'border-transparent text-slate-500 hover:text-slate-900'
//           }`}
//         >
//           All Contacts
//         </button>

//         <button
//           type="button"
//           onClick={() => setActiveTab('groups')}
//           className={`border-b-2 px-4 py-3 text-sm font-medium ${
//             activeTab === 'groups'
//               ? 'border-emerald-600 text-emerald-700'
//               : 'border-transparent text-slate-500 hover:text-slate-900'
//           }`}
//         >
//           Groups & Audiences
//         </button>

//         <button
//           type="button"
//           onClick={() => setActiveTab('import')}
//           className={`border-b-2 px-4 py-3 text-sm font-medium ${
//             activeTab === 'import'
//               ? 'border-emerald-600 text-emerald-700'
//               : 'border-transparent text-slate-500 hover:text-slate-900'
//           }`}
//         >
//           Import Contacts
//         </button>

//       </div>

//       {/* ========================================
//           CONTACTS TAB
//       ======================================== */}

//       {activeTab === 'contacts' && (
//         <div className="space-y-5">

//           {/* ADD CONTACT */}

//           <form
//             className="card space-y-4"
//             onSubmit={add}
//           >
//             <div>
//               <h2 className="text-lg font-semibold">Add a contact</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Add an individual contact to your CRM.
//               </p>
//             </div>

//             <div className="grid gap-4 md:grid-cols-3">

//               <div>
//                 <label className="label" htmlFor="c-name">
//                   Name
//                 </label>

//                 <input
//                   id="c-name"
//                   className="input"
//                   placeholder="Contact name"
//                   value={f.name}
//                   onChange={(e) =>
//                     setF({ ...f, name: e.target.value })
//                   }
//                 />
//               </div>

//               <div>
//                 <label className="label" htmlFor="c-phone">
//                   Phone
//                 </label>

//                 <input
//                   id="c-phone"
//                   className="input"
//                   placeholder="919876543210"
//                   value={f.phone}
//                   onChange={(e) =>
//                     setF({ ...f, phone: e.target.value })
//                   }
//                   required
//                 />
//               </div>

//               <div className="flex items-end">
//                 <button
//                   className="btn w-full"
//                   disabled={busy}
//                 >
//                   Add contact
//                 </button>
//               </div>

//             </div>
//           </form>

//           {/* CONTACT TABLE */}

//           <section className="card space-y-4">

//             <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">

//               <div>
//                 <h2 className="text-lg font-semibold">
//                   Your contacts
//                 </h2>

//                 <p className="text-sm text-slate-500">
//                   {filteredRows.length} contacts displayed
//                   {selectedCount > 0 && ` · ${selectedCount} selected`}
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 className="btn-ghost"
//                 onClick={() => setActiveTab('import')}
//               >
//                 Import CSV / Excel
//               </button>

//             </div>

//             {/* SEARCH + FILTER */}

//             <div className="grid gap-3 md:grid-cols-3">

//               <div className="md:col-span-2">
//                 <input
//                   className="input"
//                   placeholder="Search name or phone number..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>

//               <div>
//                 <select
//                   className="input"
//                   value={filter}
//                   onChange={(e) => setFilter(e.target.value)}
//                 >
//                   <option value="all">All contacts</option>
//                   <option value="opted-in">Opted in</option>
//                   <option value="opted-out">Opted out</option>
//                   <option value="window-open">Reply window open</option>
//                   <option value="window-closed">Reply window closed</option>
//                 </select>
//               </div>

//             </div>

//             {/* BULK ACTIONS */}

//             {selectedCount > 0 && (
//               <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">

//                 <div>
//                   <p className="font-semibold text-emerald-900">
//                     {selectedCount} contacts selected
//                   </p>

//                   <p className="text-sm text-emerald-700">
//                     Choose an action for your selected contacts.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">

//                   <button
//                     type="button"
//                     className="btn-ghost"
//                     onClick={() => setShowGroupForm(!showGroupForm)}
//                   >
//                     Create group
//                   </button>

//                   <button
//                     type="button"
//                     className="btn"
//                     onClick={sendToCampaign}
//                   >
//                     Send message
//                   </button>

//                   <button
//                     type="button"
//                     className="btn-danger-link"
//                     disabled={busy}
//                     onClick={deleteSelected}
//                   >
//                     Delete selected
//                   </button>

//                 </div>
//               </div>
//             )}

//             {/* CREATE GROUP FORM */}

//             {showGroupForm && selectedCount > 0 && (
//               <form
//                 onSubmit={createGroup}
//                 className="rounded-xl border border-slate-200 bg-slate-50 p-4"
//               >
//                 <h3 className="font-semibold">
//                   Create group from selected contacts
//                 </h3>

//                 <p className="mb-3 mt-1 text-sm text-slate-500">
//                   The selected contacts will become members of this reusable group.
//                 </p>

//                 <div className="flex flex-col gap-3 sm:flex-row">

//                   <input
//                     className="input flex-1"
//                     placeholder="e.g. VIP Customers"
//                     value={groupName}
//                     onChange={(e) => setGroupName(e.target.value)}
//                     required
//                   />

//                   <button
//                     type="submit"
//                     className="btn"
//                     disabled={busy || !groupName.trim()}
//                   >
//                     {busy ? 'Creating...' : 'Save group'}
//                   </button>

//                 </div>
//               </form>
//             )}

//             {/* TABLE */}

//             {filteredRows.length === 0 ? (
//               <Empty
//                 title="No contacts found"
//                 desc="Try another search or add/import contacts."
//               />
//             ) : (

//               <div className="overflow-x-auto rounded-xl border border-slate-200">

//                 <table className="w-full min-w-[850px]">

//                   <thead className="bg-slate-50">
//                     <tr>
//                       <th className="th w-12">
//                         <input
//                           type="checkbox"
//                           aria-label="Select all visible contacts"
//                           checked={allVisibleSelected}
//                           onChange={toggleAll}
//                         />
//                       </th>

//                       <th className="th">Name</th>
//                       <th className="th">Phone</th>
//                       <th className="th">Opted in</th>
//                       <th className="th">Reply window</th>
//                       <th className="th text-right">Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredRows.map((contact) => (
//                       <tr
//                         key={contact._id}
//                         className="hover:bg-slate-50"
//                       >

//                         <td className="td">
//                           <input
//                             type="checkbox"
//                             aria-label={`Select ${contact.name || contact.phone}`}
//                             checked={selectedIds.includes(contact._id)}
//                             onChange={() => toggleContact(contact._id)}
//                           />
//                         </td>

//                         <td className="td font-medium text-slate-900">
//                           {contact.name || '-'}
//                         </td>

//                         <td className="td">
//                           {contact.phone}
//                         </td>

//                         <td className="td">
//                           <Badge kind={contact.optedIn ? 'ok' : 'muted'}>
//                             {contact.optedIn ? 'Yes' : 'No'}
//                           </Badge>
//                         </td>

//                         <td className="td">
//                           <Badge kind={windowOpen(contact) ? 'ok' : 'muted'}>
//                             {windowOpen(contact) ? 'Open' : 'Closed'}
//                           </Badge>
//                         </td>

//                         <td className="td text-right">
//                           <button
//                             type="button"
//                             className="btn-danger-link"
//                             onClick={() => removeContact(contact._id)}
//                           >
//                             Remove
//                           </button>
//                         </td>

//                       </tr>
//                     ))}
//                   </tbody>

//                 </table>

//               </div>
//             )}

//             {selectedCount > 0 && (
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   className="text-sm text-slate-500 hover:text-slate-900"
//                   onClick={() => setSelectedIds([])}
//                 >
//                   Clear selection
//                 </button>
//               </div>
//             )}

//           </section>

//         </div>
//       )}

//       {/* ========================================
//           GROUPS TAB
//       ======================================== */}

//       {activeTab === 'groups' && (
//         <section className="card space-y-4">

//           <div>
//             <h2 className="text-lg font-semibold">
//               Groups & Audiences
//             </h2>

//             <p className="text-sm text-slate-500">
//               Organize contacts into reusable audiences for campaigns.
//             </p>
//           </div>

//           {groups.length === 0 ? (
//             <Empty
//               title="No groups created yet"
//               desc="Select contacts from All Contacts and create your first group."
//             />
//           ) : (

//             <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

//               {groups.map((group) => (
//                 <div
//                   key={group._id}
//                   className="rounded-xl border border-slate-200 p-4"
//                 >

//                   <div className="flex items-center justify-between">
//                     <h3 className="font-semibold text-slate-900">
//                       {group.name}
//                     </h3>

//                     <Badge kind="ok">Group</Badge>
//                   </div>

//                   <p className="mt-2 text-sm text-slate-500">
//                     {group.contactCount ?? group.contactIds?.length ?? 0} contacts
//                   </p>

//                   <button
//                     type="button"
//                     className="btn-ghost mt-4 w-full"
//                     onClick={() => sendGroupToCampaign(group._id)}
//                   >
//                     Use in campaign
//                   </button>

//                 </div>
//               ))}

//             </div>
//           )}

//           <button
//             type="button"
//             className="btn-ghost"
//             onClick={() => setActiveTab('contacts')}
//           >
//             Select contacts to create a group
//           </button>

//         </section>
//       )}

//       {/* ========================================
//           IMPORT TAB
//       ======================================== */}

//       {activeTab === 'import' && (
//         <div className="grid gap-5 xl:grid-cols-2">

//           {/* FILE IMPORT */}

//           <section className="card space-y-4">

//             <div>
//               <h2 className="text-lg font-semibold">
//                 Import CSV / Excel
//               </h2>

//               <p className="mt-1 text-sm text-slate-500">
//                 Upload a CSV or Excel file containing your contacts.
//               </p>
//             </div>

//             <input
//               ref={fileRef}
//               type="file"
//               accept=".csv,.xlsx,.xls"
//               className="hidden"
//               onChange={handleFile}
//             />

//             <button
//               type="button"
//               onClick={() => fileRef.current?.click()}
//               className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
//             >

//               <span className="mb-3 text-3xl">↑</span>

//               <span className="font-semibold text-slate-800">
//                 Choose CSV or Excel file
//               </span>

//               <span className="mt-1 text-sm text-slate-500">
//                 Supports .csv, .xlsx and .xls
//               </span>

//             </button>

//             {fileName && (
//               <div className="rounded-lg bg-slate-50 p-3">
//                 <p className="text-sm font-medium">
//                   {fileName}
//                 </p>

//                 <p className="text-sm text-slate-500">
//                   {fileContacts.length} valid unique contacts detected
//                 </p>
//               </div>
//             )}

//             {fileContacts.length > 0 && (
//               <>
//                 <div className="overflow-x-auto rounded-lg border border-slate-200">

//                   <table className="w-full text-sm">

//                     <thead className="bg-slate-50">
//                       <tr>
//                         <th className="p-2 text-left">Name</th>
//                         <th className="p-2 text-left">Phone</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {fileContacts.slice(0, 5).map((contact, index) => (
//                         <tr key={`${contact.phone}-${index}`}>
//                           <td className="border-t p-2">
//                             {contact.name || '-'}
//                           </td>

//                           <td className="border-t p-2">
//                             {contact.phone}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>

//                   </table>

//                 </div>

//                 {fileContacts.length > 5 && (
//                   <p className="text-xs text-slate-500">
//                     Showing first 5 of {fileContacts.length} contacts.
//                   </p>
//                 )}

//                 <button
//                   type="button"
//                   className="btn w-full"
//                   onClick={importFileContacts}
//                   disabled={busy}
//                 >
//                   {busy
//                     ? 'Importing...'
//                     : `Import ${fileContacts.length} contacts`}
//                 </button>

//               </>
//             )}

//             <p className="text-xs text-slate-500">
//               Supported columns include Name, Full Name, Phone, Mobile and WhatsApp.
//               Include the country code in phone numbers.
//             </p>

//           </section>

//           {/* MANUAL IMPORT */}

//           <section className="card space-y-4">

//             <div>
//               <h2 className="text-lg font-semibold">
//                 Paste contacts
//               </h2>

//               <p className="mt-1 text-sm text-slate-500">
//                 You can also paste multiple contacts manually.
//               </p>
//             </div>

//             <textarea
//               className="input"
//               rows="9"
//               aria-label="Bulk import contacts"
//               placeholder={'One contact per line:\nAsha,919876543210\nRahul,919876543211'}
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//             />

//             <button
//               type="button"
//               className="btn w-full"
//               onClick={importAll}
//               disabled={busy || !text.trim()}
//             >
//               {busy ? 'Importing...' : 'Import contacts'}
//             </button>

//           </section>

//         </div>
//       )}

//       {/* ========================================
//           CONSENT NOTICE
//       ======================================== */}

//       <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
//         <p className="text-sm font-medium text-amber-900">
//           WhatsApp messaging compliance
//         </p>

//         <p className="mt-1 text-sm text-amber-800">
//           Only message people who have agreed to receive WhatsApp messages.
//           Contacts who have opted out must be excluded from campaigns.
//           Marketing messages outside the 24-hour customer service window
//           require an approved WhatsApp template.
//         </p>
//       </div>

//     </div>
//   );
// }



'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Empty, PageHeader } from '@/components/ui';
import useContacts, { windowOpen } from './UseContact';

const PAGE_SIZE = 10;

export default function ContactsView() {
  const {
    fileRef,
    groups,
    rows,
    filteredRows,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    fileContacts,
    fileName,
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
    activeTab,
    setActiveTab,
    msg,
    error,
    busy,
    optedInCount,
    openWindowCount,
    consent,
    setConsent,
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
  } = useContacts();

  // Pagination
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  );

  useEffect(() => {
    setPage(1);
  }, [search, filter, activeTab]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleContacts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const pageIds = visibleContacts.map((contact) => contact._id);

  const allPageSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  const togglePage = () => {
    if (allPageSelected) {
      pageIds.forEach((id) => {
        if (selectedIds.includes(id)) toggleContact(id);
      });
    } else {
      pageIds.forEach((id) => {
        if (!selectedIds.includes(id)) toggleContact(id);
      });
    }
  };

  const startIndex = filteredRows.length
    ? (page - 1) * PAGE_SIZE + 1
    : 0;

  const endIndex = Math.min(
    page * PAGE_SIZE,
    filteredRows.length
  );

  return (
    <div className="space-y-6">

      <PageHeader
        title="Contacts & Audiences"
        desc="Manage contacts, permissions and WhatsApp campaign audiences."
      />

      {msg && <Alert>{msg}</Alert>}
      {error && <Alert>{error}</Alert>}

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        {[
          { label: 'Total Contacts', value: rows.length },
          { label: 'Contact Groups', value: groups.length },
          { label: 'Opted In', value: optedInCount },
          { label: 'Open Reply Windows', value: openWindowCount },
        ].map((item) => (
          <div key={item.label} className="card">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}

      </div>

      {/* TABS */}

      <div className="flex flex-wrap gap-5 border-b border-slate-200">

        {[
          ['contacts', 'Contacts'],
          ['groups', 'Groups'],
          ['import', 'Import'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`border-b-2 px-2 py-3 text-sm font-medium ${
              activeTab === value
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* CONTACTS */}

      {activeTab === 'contacts' && (
        <div className="space-y-5">

          {/* ADD CONTACT */}

          <form onSubmit={add} className="card space-y-4">

            <div>
              <h2 className="font-semibold text-slate-900">
                Add new contact
              </h2>
              <p className="text-sm text-slate-500">
                Save a contact to your CRM.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">

              <input
                className="input"
                placeholder="Contact name"
                value={f.name}
                onChange={(e) =>
                  setF({ ...f, name: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Phone number"
                value={f.phone}
                onChange={(e) =>
                  setF({ ...f, phone: e.target.value })
                }
                required
              />

              <button className="btn" disabled={busy}>
                Add contact
              </button>

            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I confirm this person has agreed to receive WhatsApp messages.
            </label>

          </form>

          {/* CONTACT LIST */}

          <section className="card space-y-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Your contacts
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {startIndex}–{endIndex} of {filteredRows.length}
                  {selectedCount > 0 && ` · ${selectedCount} selected`}
                </p>
              </div>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveTab('import')}
              >
                + Import contacts
              </button>

            </div>

            {/* SEARCH */}

            <div className="grid gap-3 md:grid-cols-3">

              <input
                className="input md:col-span-2"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All contacts</option>
                <option value="opted-in">Opted in</option>
                <option value="opted-out">Not opted in</option>
                <option value="window-open">Reply window open</option>
                <option value="window-closed">Reply window closed</option>
              </select>

            </div>

            {/* BULK ACTIONS */}

            {selectedCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">

                <span className="text-sm font-semibold text-emerald-900">
                  {selectedCount} selected
                </span>

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowGroupForm(!showGroupForm)}
                  >
                    Create group
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={sendToCampaign}
                  >
                    Use in campaign
                  </button>

                  <button
                    type="button"
                    className="btn-danger-link"
                    disabled={busy}
                    onClick={deleteSelected}
                  >
                    Delete
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={clearSelection}
                  >
                    Clear
                  </button>

                </div>

              </div>
            )}

            {/* CREATE GROUP */}

            {showGroupForm && selectedCount > 0 && (
              <form
                onSubmit={createGroup}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row">

                  <input
                    className="input flex-1"
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />

                  <button
                    className="btn"
                    disabled={busy || !groupName.trim()}
                  >
                    Save group
                  </button>

                </div>
              </form>
            )}

            {/* TABLE */}

            {filteredRows.length === 0 ? (
              <Empty
                title="No contacts found"
                desc="Try another search or add/import contacts."
              />
            ) : (

              <div className="overflow-x-auto rounded-xl border border-slate-200">

                <table className="w-full min-w-[780px]">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={togglePage}
                          aria-label="Select current page"
                        />
                      </th>
                      <th className="th">Contact</th>
                      <th className="th">Phone</th>
                      <th className="th">Consent</th>
                      <th className="th">Reply</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleContacts.map((contact) => {
                      const isOpen = windowOpen(contact);

                      return (
                        <tr key={contact._id} className="hover:bg-slate-50">

                          <td className="td">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(contact._id)}
                              onChange={() => toggleContact(contact._id)}
                              aria-label={`Select ${contact.name || contact.phone}`}
                            />
                          </td>

                          <td className="td font-medium text-slate-900">
                            {contact.name || 'Unnamed'}
                          </td>

                          <td className="td text-slate-600">
                            {contact.phone}
                          </td>

                          <td className="td">
                            <Badge kind={contact.optedIn ? 'ok' : 'muted'}>
                              {contact.optedIn ? 'Opted in' : 'No consent'}
                            </Badge>
                          </td>

                          <td className="td">
                            <Badge kind={isOpen ? 'ok' : 'muted'}>
                              {isOpen ? 'Open' : 'Closed'}
                            </Badge>
                          </td>

                          <td className="td">
                            <div className="flex justify-end gap-3">

                              <button
                                type="button"
                                className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                                onClick={() =>
                                  setContactConsent(contact, !contact.optedIn)
                                }
                              >
                                {contact.optedIn ? 'Withdraw' : 'Record consent'}
                              </button>

                              <button
                                type="button"
                                className="text-xs font-medium text-red-600 hover:text-red-800"
                                onClick={() => removeContact(contact._id)}
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>

              </div>
            )}

            {/* PAGINATION */}

            {filteredRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                  <span className="ml-2">
                    · 10 contacts per page
                  </span>
                </p>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    className="btn"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next →
                  </button>

                </div>

              </div>
            )}

          </section>
        </div>
      )}

      {/* GROUPS */}

      {activeTab === 'groups' && (
        <section className="card space-y-4">

          <div>
            <h2 className="font-semibold">Groups & Audiences</h2>
            <p className="text-sm text-slate-500">
              Reusable contact groups for your campaigns.
            </p>
          </div>

          {groups.length === 0 ? (
            <Empty
              title="No groups created"
              desc="Select contacts and create your first group."
            />
          ) : (

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

              {groups.map((group) => (
                <div
                  key={group._id}
                  className="rounded-xl border border-slate-200 p-4"
                >

                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{group.name}</h3>
                    <Badge kind="ok">Group</Badge>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {group.contactCount ?? group.contactIds?.length ?? 0} contacts
                  </p>

                  <button
                    type="button"
                    className="btn-ghost mt-4 w-full"
                    onClick={() => sendGroupToCampaign(group._id)}
                  >
                    Use in campaign
                  </button>

                </div>
              ))}

            </div>
          )}

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setActiveTab('contacts')}
          >
            Back to contacts
          </button>

        </section>
      )}

      {/* IMPORT */}

      {activeTab === 'import' && (
        <div className="grid gap-5 xl:grid-cols-2">

          {/* FILE IMPORT */}

          <section className="card space-y-4">

            <div>
              <h2 className="font-semibold">CSV / Excel Import</h2>
              <p className="text-sm text-slate-500">
                Upload your contact spreadsheet.
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center hover:border-emerald-500 hover:bg-emerald-50"
            >
              <span className="text-3xl">↑</span>
              <p className="mt-2 font-semibold">Choose CSV or Excel</p>
              <p className="mt-1 text-xs text-slate-500">
                .csv, .xlsx, .xls
              </p>
            </button>

            {fileName && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium">{fileName}</p>
                <p className="text-slate-500">
                  {fileContacts.length} unique contacts found
                </p>
              </div>
            )}

            {fileContacts.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileContacts.slice(0, 5).map((contact, index) => (
                        <tr key={`${contact.phone}-${index}`}>
                          <td className="border-t p-2">
                            {contact.name || '-'}
                          </td>
                          <td className="border-t p-2">
                            {contact.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-slate-500">
                  Previewing up to 5 of {fileContacts.length} contacts.
                </p>

                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I confirm these imported contacts have genuinely agreed to receive WhatsApp messages.
                </label>

                <button
                  type="button"
                  className="btn w-full"
                  disabled={busy}
                  onClick={importFileContacts}
                >
                  {busy ? 'Importing...' : `Import ${fileContacts.length} contacts`}
                </button>
              </>
            )}

          </section>

          {/* TEXT IMPORT */}

          <section className="card space-y-4">

            <div>
              <h2 className="font-semibold">Paste contacts</h2>
              <p className="text-sm text-slate-500">
                One contact per line: Name, Phone.
              </p>
            </div>

            <textarea
              className="input"
              rows={9}
              placeholder={'Asha,919876543210\nRahul,919876543211'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I confirm these contacts have genuinely agreed to receive WhatsApp messages.
            </label>

            <button
              type="button"
              className="btn w-full"
              disabled={busy || !text.trim()}
              onClick={importAll}
            >
              {busy ? 'Importing...' : 'Import contacts'}
            </button>

          </section>

        </div>
      )}

      {/* COMPLIANCE NOTICE */}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          WhatsApp messaging compliance
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Only send messages to people who have provided genuine WhatsApp
          opt-in consent. Respect withdrawals. Approved templates are
          required for business-initiated messages outside the 24-hour
          customer service window.
        </p>
      </div>

    </div>
  );
}
