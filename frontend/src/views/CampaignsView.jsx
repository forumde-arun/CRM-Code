
// 'use client';

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { api } from '@/lib/api';
// import { Alert, Badge, Bubble, Empty, PageHeader } from '@/components/ui';

// const count = (campaign, ...statuses) =>
//   (campaign.messages || []).filter((message) =>
//     statuses.includes(message.status)
//   ).length;

// const bodyOf = (template) =>
//   template?.components?.find((component) => component.type === 'BODY')
//     ?.text || '';

// const nVars = (template) =>
//   new Set(bodyOf(template).match(/\{\{\s*\d+\s*\}\}/g) || []).size;

// const kindOf = (status) =>
//   status === 'completed'
//     ? 'ok'
//     : status === 'running'
//       ? 'warn'
//       : 'bad';

// const getId = (item) => String(item?._id || item?.id || '');

// export default function CampaignsView() {
//   const [tpls, setTpls] = useState([]);
//   const [list, setList] = useState([]);
//   const [contacts, setContacts] = useState([]);
//   const [groups, setGroups] = useState([]);

//   const [f, setF] = useState({
//     name: '',
//     tpl: '',
//     vars: [],
//   });

//   const [audience, setAudience] = useState('all');
//   const [selectedContactIds, setSelectedContactIds] = useState([]);
//   const [selectedGroupIds, setSelectedGroupIds] = useState([]);

//   const [phone, setPhone] = useState('');
//   const [msg, setMsg] = useState('');
//   const [busy, setBusy] = useState(false);
//   const [contactSearch, setContactSearch] = useState('');

//   // Load campaigns.
//   const load = useCallback(async () => {
//     try {
//       const data = await api.get('/campaigns');
//       setList(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error('Campaign loading failed:', error);
//     }
//   }, []);

//   // Initial data loading.
//   useEffect(() => {
//     let active = true;

//     const initialize = async () => {
//       const results = await Promise.allSettled([
//         api.get('/templates'),
//         api.get('/contacts'),
//         api.get('/contact-groups'),
//         api.get('/campaigns'),
//       ]);

//       if (!active) return;

//       const [
//         templatesResult,
//         contactsResult,
//         groupsResult,
//         campaignsResult,
//       ] = results;

//       if (templatesResult.status === 'fulfilled') {
//         const data = templatesResult.value;

//         setTpls(
//           Array.isArray(data)
//             ? data.filter((item) => item.status === 'APPROVED')
//             : []
//         );
//       } else {
//         setMsg(
//           templatesResult.reason?.message ||
//             'Unable to load WhatsApp templates.'
//         );
//       }

//       if (contactsResult.status === 'fulfilled') {
//         setContacts(
//           Array.isArray(contactsResult.value)
//             ? contactsResult.value
//             : []
//         );
//       }

//       if (groupsResult.status === 'fulfilled') {
//         setGroups(
//           Array.isArray(groupsResult.value)
//             ? groupsResult.value
//             : []
//         );
//       } else {
//         console.error(
//           'Contact groups loading failed:',
//           groupsResult.reason
//         );
//       }

//       if (campaignsResult.status === 'fulfilled') {
//         setList(
//           Array.isArray(campaignsResult.value)
//             ? campaignsResult.value
//             : []
//         );
//       }

//       // Read selections passed from Contacts page.
//       const params = new URLSearchParams(window.location.search);

//       const contactIds = (params.get('contactIds') || '')
//         .split(',')
//         .map((id) => id.trim())
//         .filter(Boolean);

//       const groupIds = [
//         ...new Set([
//           ...params.getAll('groupId'),
//           ...(params.get('groupIds') || '').split(','),
//         ]),
//       ].map((id) => id.trim()).filter(Boolean);

//       if (contactIds.length) {
//         setAudience('selected');
//         setSelectedContactIds([...new Set(contactIds)]);
//       } else if (groupIds.length) {
//         setAudience('group');
//         setSelectedGroupIds(groupIds);
//       }
//     };

//     initialize();

//     return () => {
//       active = false;
//     };
//   }, []);

//   // Refresh campaign results periodically.
//   useEffect(() => {
//     const interval = setInterval(load, 5000);
//     return () => clearInterval(interval);
//   }, [load]);

//   // Current selected template.
//   const template = useMemo(
//     () =>
//       tpls.find(
//         (item) => `${item.name}|${item.language}` === f.tpl
//       ),
//     [tpls, f.tpl]
//   );

//   // Only opted-in contacts are displayed as eligible recipients.
//   const eligibleContacts = useMemo(
//     () => contacts.filter((contact) => contact.optedIn === true),
//     [contacts]
//   );

//   // Search eligible contacts.
//   const filteredContacts = useMemo(() => {
//     const search = contactSearch.toLowerCase().trim();

//     if (!search) return eligibleContacts;

//     return eligibleContacts.filter((contact) =>
//       `${contact.name || ''} ${contact.phone || ''}`
//         .toLowerCase()
//         .includes(search)
//     );
//   }, [eligibleContacts, contactSearch]);

//   const selectedContactCount = selectedContactIds.length;
//   const selectedGroupCount = selectedGroupIds.length;

//   // Select a template and prepare its variables.
//   const pickTemplate = (value) => {
//     const selected = tpls.find(
//       (item) => `${item.name}|${item.language}` === value
//     );

//     setF((previous) => ({
//       ...previous,
//       tpl: value,
//       vars: Array(selected ? nVars(selected) : 0).fill(''),
//     }));
//   };

//   // Update template variables.
//   const setVariable = (index, value) => {
//     setF((previous) => ({
//       ...previous,
//       vars: previous.vars.map((item, i) =>
//         i === index ? value : item
//       ),
//     }));
//   };

//   // Toggle individual contact selection.
//   const toggleContact = (id) => {
//     setSelectedContactIds((previous) =>
//       previous.includes(id)
//         ? previous.filter((item) => item !== id)
//         : [...previous, id]
//     );
//   };

//   // Toggle group selection.
//   const toggleGroup = (id) => {
//     setSelectedGroupIds((previous) =>
//       previous.includes(id)
//         ? previous.filter((item) => item !== id)
//         : [...previous, id]
//     );
//   };

//   // Select all currently visible contacts.
//   const selectAllVisible = () => {
//     const visibleIds = filteredContacts.map(getId).filter(Boolean);

//     setSelectedContactIds((previous) => [
//       ...new Set([...previous, ...visibleIds]),
//     ]);
//   };

//   const clearSelectedContacts = () => {
//     setSelectedContactIds([]);
//   };

//   // Template preview.
//   const preview = bodyOf(template).replace(
//     /\{\{\s*(\d+)\s*\}\}/g,
//     (_, key) =>
//       (f.vars[Number(key) - 1] || `{{${key}}}`).replaceAll(
//         '{{name}}',
//         'Asha'
//       )
//   );

//   const templatePayload = () => {
//     const [templateName, language] = f.tpl.split('|');

//     return {
//       templateName,
//       language,
//       variables: f.vars,
//     };
//   };

//   // Create and send campaign.
//   const send = async (event) => {
//     event.preventDefault();
//     setMsg('');

//     if (!f.name.trim()) {
//       setMsg('Please enter a campaign name.');
//       return;
//     }

//     if (!template) {
//       setMsg('Please select an approved WhatsApp template.');
//       return;
//     }

//     if (f.vars.some((value) => !value.trim())) {
//       setMsg('Please fill in all template variables.');
//       return;
//     }

//     let audiencePayload;

//     if (audience === 'all') {
//       audiencePayload = {
//         type: 'all',
//       };
//     } else if (audience === 'group') {
//       if (!selectedGroupIds.length) {
//         setMsg('Please select at least one contact group.');
//         return;
//       }

//       audiencePayload = {
//         type: 'group',
//         groupIds: selectedGroupIds,
//       };
//     } else if (audience === 'selected') {
//       if (!selectedContactIds.length) {
//         setMsg('Please select at least one contact.');
//         return;
//       }

//       audiencePayload = {
//         type: 'selected',
//         contactIds: selectedContactIds,
//       };
//     } else {
//       setMsg('Invalid campaign audience.');
//       return;
//     }

//     setBusy(true);

//     try {
//       const result = await api.post('/campaigns', {
//         name: f.name.trim(),
//         ...templatePayload(),
//         audience: audiencePayload,
//       });

//       setMsg(
//         `Campaign started successfully. ${result.recipientCount ?? 'Your'} eligible recipient(s) selected.`
//       );

//       setF({
//         name: '',
//         tpl: '',
//         vars: [],
//       });

//       setSelectedContactIds([]);
//       setSelectedGroupIds([]);
//       setAudience('all');
//       setContactSearch('');

//       await load();
//     } catch (error) {
//       setMsg(error.message || 'Unable to start campaign.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   // Send a test message to one number.
//   const sendTest = async () => {
//     setMsg('');

//     if (!template) {
//       setMsg('Please select an approved template.');
//       return;
//     }

//     if (!phone.trim()) {
//       setMsg('Enter a test phone number.');
//       return;
//     }

//     if (f.vars.some((value) => !value.trim())) {
//       setMsg('Please fill in all template variables.');
//       return;
//     }

//     setBusy(true);

//     try {
//       const result = await api.post('/campaigns/test', {
//         ...templatePayload(),
//         phone,
//       });

//       setMsg(
//         `Test message accepted. Message ID: ${result.id}`
//       );
//     } catch (error) {
//       setMsg(error.message || 'Unable to send test message.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const buttonDisabled =
//     busy ||
//     !template ||
//     !f.name.trim() ||
//     f.vars.some((value) => !value.trim()) ||
//     (audience === 'group' && selectedGroupIds.length === 0) ||
//     (audience === 'selected' && selectedContactIds.length === 0);

//   return (
//     <>
//       <PageHeader
//         title="Campaigns"
//         desc="Create WhatsApp campaigns and choose exactly who receives your messages."
//       />

//       {msg && <Alert>{msg}</Alert>}

//       {tpls.length === 0 && (
//         <Alert>
//           No approved templates found. Create a template on the Templates
//           page and wait for APPROVED status.
//         </Alert>
//       )}

//       <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
//         <form className="card space-y-5" onSubmit={send}>
//           <h2 className="text-lg font-semibold">
//             New campaign
//           </h2>

//           {/* Campaign name */}
//           <div>
//             <label className="label" htmlFor="campaign-name">
//               Campaign name
//             </label>

//             <input
//               id="campaign-name"
//               className="input"
//               placeholder="Example: November promotion"
//               value={f.name}
//               onChange={(event) =>
//                 setF((previous) => ({
//                   ...previous,
//                   name: event.target.value,
//                 }))
//               }
//               required
//             />
//           </div>

//           {/* Template selection */}
//           <div>
//             <label className="label" htmlFor="campaign-template">
//               WhatsApp template
//             </label>

//             <select
//               id="campaign-template"
//               className="input"
//               value={f.tpl}
//               onChange={(event) => pickTemplate(event.target.value)}
//               required
//             >
//               <option value="">
//                 Choose an approved template
//               </option>

//               {tpls.map((item) => (
//                 <option
//                   key={`${item.name}|${item.language}`}
//                   value={`${item.name}|${item.language}`}
//                 >
//                   {item.name} ({item.language})
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Template variables */}
//           {f.vars.map((value, index) => (
//             <div key={index}>
//               <label className="label">
//                 Template variable {'{{'}
//                 {index + 1}
//                 {'}}'}
//               </label>

//               <input
//                 className="input"
//                 placeholder={`Value for {{${index + 1}}}. Use {{name}} for each contact's name.`}
//                 value={value}
//                 onChange={(event) =>
//                   setVariable(index, event.target.value)
//                 }
//                 required
//               />
//             </div>
//           ))}

//           {/* Audience selection */}
//           <div className="space-y-3 border-t border-slate-200 pt-4">
//             <h3 className="font-semibold">
//               Choose campaign audience
//             </h3>

//             <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
//               <input
//                 type="radio"
//                 name="audience"
//                 value="all"
//                 checked={audience === 'all'}
//                 onChange={() => setAudience('all')}
//                 className="mt-1"
//               />

//               <span>
//                 <span className="block font-medium">
//                   All eligible contacts
//                 </span>

//                 <span className="text-sm text-slate-500">
//                   Send to all contacts with recorded WhatsApp opt-in consent.
//                 </span>
//               </span>
//             </label>

//             <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
//               <input
//                 type="radio"
//                 name="audience"
//                 value="group"
//                 checked={audience === 'group'}
//                 onChange={() => setAudience('group')}
//                 className="mt-1"
//               />

//               <span>
//                 <span className="block font-medium">
//                   Specific groups
//                 </span>

//                 <span className="text-sm text-slate-500">
//                   Choose one or more saved contact groups.
//                 </span>
//               </span>
//             </label>

//             <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
//               <input
//                 type="radio"
//                 name="audience"
//                 value="selected"
//                 checked={audience === 'selected'}
//                 onChange={() => setAudience('selected')}
//                 className="mt-1"
//               />

//               <span>
//                 <span className="block font-medium">
//                   Selected contacts
//                 </span>

//                 <span className="text-sm text-slate-500">
//                   Choose individual contacts for this campaign.
//                 </span>
//               </span>
//             </label>
//           </div>

//           {/* Group selection */}
//           {audience === 'group' && (
//             <div className="space-y-3 rounded-lg border border-slate-200 p-3">
//               <div className="flex items-center justify-between">
//                 <h3 className="font-semibold">
//                   Select groups
//                 </h3>

//                 <Badge kind="info">
//                   {selectedGroupCount} selected
//                 </Badge>
//               </div>

//               {groups.length === 0 ? (
//                 <Empty
//                   title="No groups available"
//                   desc="Create a contact group on the Contacts page first."
//                 />
//               ) : (
//                 <div className="space-y-2">
//                   {groups.map((group) => {
//                     const id = getId(group);

//                     return (
//                       <label
//                         key={id}
//                         className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
//                       >
//                         <span className="flex items-center gap-2">
//                           <input
//                             type="checkbox"
//                             checked={selectedGroupIds.includes(id)}
//                             onChange={() => toggleGroup(id)}
//                           />

//                           <span className="font-medium">
//                             {group.name}
//                           </span>
//                         </span>

//                         <span className="text-sm text-slate-500">
//                           {group.contactCount ??
//                             group.contactIds?.length ??
//                             0}{' '}
//                           contacts
//                         </span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Individual contact selection */}
//           {audience === 'selected' && (
//             <div className="space-y-3 rounded-lg border border-slate-200 p-3">
//               <div className="flex flex-wrap items-center justify-between gap-2">
//                 <h3 className="font-semibold">
//                   Select contacts
//                 </h3>

//                 <Badge kind="info">
//                   {selectedContactCount} selected
//                 </Badge>
//               </div>

//               <input
//                 className="input"
//                 placeholder="Search name or phone number"
//                 value={contactSearch}
//                 onChange={(event) =>
//                   setContactSearch(event.target.value)
//                 }
//               />

//               <div className="flex flex-wrap gap-3 text-sm">
//                 <button
//                   type="button"
//                   className="btn-ghost"
//                   onClick={selectAllVisible}
//                   disabled={!filteredContacts.length}
//                 >
//                   Select visible
//                 </button>

//                 <button
//                   type="button"
//                   className="btn-ghost"
//                   onClick={clearSelectedContacts}
//                   disabled={!selectedContactIds.length}
//                 >
//                   Clear selection
//                 </button>
//               </div>

//               {filteredContacts.length === 0 ? (
//                 <Empty
//                   title="No eligible contacts found"
//                   desc="Only contacts with recorded opt-in consent are shown here."
//                 />
//               ) : (
//                 <div className="max-h-72 space-y-2 overflow-y-auto">
//                   {filteredContacts.map((contact) => {
//                     const id = getId(contact);

//                     return (
//                       <label
//                         key={id}
//                         className="flex cursor-pointer items-center gap-3 rounded-md bg-slate-50 p-3"
//                       >
//                         <input
//                           type="checkbox"
//                           checked={selectedContactIds.includes(id)}
//                           onChange={() => toggleContact(id)}
//                         />

//                         <span className="min-w-0">
//                           <span className="block truncate font-medium">
//                             {contact.name || 'Unnamed contact'}
//                           </span>

//                           <span className="text-sm text-slate-500">
//                             {contact.phone}
//                           </span>
//                         </span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Test message */}
//           {template && (
//             <div className="space-y-2 border-t border-slate-200 pt-4">
//               <label className="label" htmlFor="test-phone">
//                 Test message number
//               </label>

//               <div className="flex flex-wrap gap-2">
//                 <input
//                   id="test-phone"
//                   className="input min-w-0 flex-1"
//                   placeholder="Number with country code"
//                   value={phone}
//                   onChange={(event) => setPhone(event.target.value)}
//                 />

//                 <button
//                   type="button"
//                   className="btn-ghost"
//                   disabled={
//                     busy ||
//                     !phone.trim() ||
//                     f.vars.some((value) => !value.trim())
//                   }
//                   onClick={sendTest}
//                 >
//                   Send test
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Campaign submission */}
//           <button
//             type="submit"
//             className="btn w-full sm:w-auto"
//             disabled={buttonDisabled}
//           >
//             {busy
//               ? 'Please wait...'
//               : audience === 'all'
//                 ? 'Send to all eligible contacts'
//                 : 'Send campaign'}
//           </button>

//           {/* Button validation help */}
//           {!busy && !template && (
//             <p className="text-xs text-amber-600">
//               Select an approved WhatsApp template to continue.
//             </p>
//           )}

//           {!busy &&
//             audience === 'group' &&
//             selectedGroupIds.length === 0 && (
//               <p className="text-xs text-amber-600">
//                 Select at least one group to enable campaign sending.
//               </p>
//             )}

//           {!busy &&
//             audience === 'selected' &&
//             selectedContactIds.length === 0 && (
//               <p className="text-xs text-amber-600">
//                 Select at least one contact to enable campaign sending.
//               </p>
//             )}
//         </form>

//         {/* Right sidebar */}
//         <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
//           {/* Message preview */}
//           <div className="card">
//             <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
//               Message preview
//             </h2>

//             <div className="rounded-lg bg-[#efeae2] p-4">
//               <Bubble>
//                 {template
//                   ? preview
//                   : 'Choose an approved template to preview your message.'}
//               </Bubble>
//             </div>
//           </div>

//           {/* Audience summary */}
//           <div className="card space-y-3">
//             <h2 className="font-semibold">
//               Audience summary
//             </h2>

//             <div className="flex justify-between gap-3 text-sm">
//               <span className="text-slate-500">
//                 Audience type
//               </span>

//               <span className="font-medium">
//                 {audience === 'all'
//                   ? 'All eligible contacts'
//                   : audience === 'group'
//                     ? 'Selected groups'
//                     : 'Selected contacts'}
//               </span>
//             </div>

//             {audience === 'all' && (
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">
//                   Eligible contacts
//                 </span>

//                 <span className="font-medium">
//                   {eligibleContacts.length}
//                 </span>
//               </div>
//             )}

//             {audience === 'group' && (
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">
//                   Groups selected
//                 </span>

//                 <span className="font-medium">
//                   {selectedGroupCount}
//                 </span>
//               </div>
//             )}

//             {audience === 'selected' && (
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">
//                   Contacts selected
//                 </span>

//                 <span className="font-medium">
//                   {selectedContactCount}
//                 </span>
//               </div>
//             )}

//             <p className="border-t border-slate-200 pt-2 text-xs text-slate-500">
//               Final recipient counts are validated by the backend.
//               Only eligible, opted-in contacts should receive messages.
//             </p>
//           </div>
//         </aside>
//       </div>

//       {/* Campaign results */}
//       <h2 className="mb-3 mt-10 text-lg font-semibold">
//         Campaign results
//       </h2>

//       {list.length === 0 ? (
//         <Empty
//           title="No campaigns yet"
//           desc="Your sent, delivered, read and failed counts will appear here and update live."
//         />
//       ) : (
//         <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
//           <table className="w-full">
//             <thead>
//               <tr>
//                 <th className="th">Campaign</th>
//                 <th className="th">Template</th>
//                 <th className="th">Audience</th>
//                 <th className="th">Status</th>
//                 <th className="th">Sent</th>
//                 <th className="th">Delivered</th>
//                 <th className="th">Read</th>
//                 <th className="th">Failed</th>
//               </tr>
//             </thead>

//             <tbody>
//               {list.map((campaign) => (
//                 <tr key={campaign._id}>
//                   <td className="td font-medium text-slate-900">
//                     {campaign.name}
//                   </td>

//                   <td className="td">
//                     {campaign.templateName}
//                   </td>

//                   <td className="td">
//                     {campaign.audienceType || 'all'}
//                   </td>

//                   <td className="td">
//                     <Badge kind={kindOf(campaign.status)}>
//                       {campaign.status}
//                     </Badge>
//                   </td>

//                   <td className="td">
//                     {count(campaign, 'sent', 'delivered', 'read')}/
//                     {(campaign.messages || []).length}
//                   </td>

//                   <td className="td">
//                     {count(campaign, 'delivered', 'read')}
//                   </td>

//                   <td className="td">
//                     {count(campaign, 'read')}
//                   </td>

//                   <td className="td">
//                     {count(campaign, 'failed')}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </>
//   );
// }




'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Badge, Bubble, Empty, PageHeader } from '@/components/ui';

const PAGE_SIZE = 10;

const getId = (item) => String(item?._id || item?.id || '');

const bodyOf = (template) =>
  template?.components?.find((item) => item.type === 'BODY')?.text || '';

const nVars = (template) =>
  new Set(bodyOf(template).match(/\{\{\s*\d+\s*\}\}/g) || []).size;

const count = (campaign, ...statuses) =>
  (campaign.messages || []).filter((message) =>
    statuses.includes(message.status)
  ).length;

const kindOf = (status) =>
  status === 'completed'
    ? 'ok'
    : status === 'running'
      ? 'warn'
      : 'bad';

const unwrapList = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export default function CampaignsView() {
  // ==========================================
  // STATE
  // ==========================================

  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);

  const [contactStats, setContactStats] = useState({
    total: 0,
    optedIn: 0,
    notOptedIn: 0,
  });

  const [contactsLoading, setContactsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    template: '',
    variables: [],
  });

  const [audience, setAudience] = useState('all');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [contactSearch, setContactSearch] = useState('');
  const [testPhone, setTestPhone] = useState('');

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [campaignPage, setCampaignPage] = useState(1);

  // ==========================================
  // LOAD CAMPAIGNS
  // ==========================================

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(unwrapList(response, 'campaigns'));
    } catch (error) {
      console.error('Campaign loading failed:', error);
    }
  }, []);

  // ==========================================
  // INITIAL DATA LOADING
  // ==========================================

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setContactsLoading(true);

    const results = await Promise.allSettled([
      api.get('/templates'),
      api.get('/campaigns/contacts'),
      api.get('/contact-groups'),
      api.get('/campaigns'),
    ]);

    const [
      templateResult,
      contactResult,
      groupResult,
      campaignResult,
    ] = results;

    // Templates
    if (templateResult.status === 'fulfilled') {
      const data = unwrapList(templateResult.value, 'templates');

      setTemplates(
        data.filter((item) => item.status === 'APPROVED')
      );
    } else {
      console.error('Template loading failed:', templateResult.reason);
      setMessage('Unable to load WhatsApp templates.');
    }

    // Contacts from MongoDB
    if (contactResult.status === 'fulfilled') {
      const response = contactResult.value;

      const allContacts = Array.isArray(response)
        ? response
        : response?.contacts || response?.data?.contacts || [];

      setContacts(allContacts);

      const stats = response?.stats || response?.data?.stats;

      setContactStats(
        stats || {
          total: allContacts.length,
          optedIn: allContacts.filter(
            (item) => item.optedIn === true
          ).length,
          notOptedIn: allContacts.filter(
            (item) => item.optedIn !== true
          ).length,
        }
      );
    } else {
      console.error('Contact loading failed:', contactResult.reason);
      setMessage(
        contactResult.reason?.message || 'Unable to load contacts.'
      );
    }

    setContactsLoading(false);

    // Groups
    if (groupResult.status === 'fulfilled') {
      setGroups(unwrapList(groupResult.value, 'groups'));
    } else {
      console.error('Group loading failed:', groupResult.reason);
    }

    // Campaign history
    if (campaignResult.status === 'fulfilled') {
      setCampaigns(unwrapList(campaignResult.value, 'campaigns'));
    }

    // Read selections from Contacts page
    const params = new URLSearchParams(window.location.search);

    const contactIds = (params.get('contactIds') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const groupIds = [
      ...params.getAll('groupId'),
      ...(params.get('groupIds') || '').split(','),
    ].map((id) => id.trim()).filter(Boolean);

    if (contactIds.length) {
      setAudience('selected');
      setSelectedContactIds([...new Set(contactIds)]);
    } else if (groupIds.length) {
      setAudience('group');
      setSelectedGroupIds([...new Set(groupIds)]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ==========================================
  // AUTO REFRESH CAMPAIGNS
  // ==========================================

  useEffect(() => {
    const interval = setInterval(loadCampaigns, 5000);
    return () => clearInterval(interval);
  }, [loadCampaigns]);

  // ==========================================
  // DERIVED DATA
  // ==========================================

  const template = useMemo(
    () =>
      templates.find(
        (item) => `${item.name}|${item.language}` === form.template
      ),
    [templates, form.template]
  );

  const eligibleContacts = useMemo(
    () => contacts.filter((item) => item.optedIn === true),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const search = contactSearch.toLowerCase().trim();

    if (!search) return eligibleContacts;

    return eligibleContacts.filter((contact) =>
      `${contact.name || ''} ${contact.phone || ''}`
        .toLowerCase()
        .includes(search)
    );
  }, [eligibleContacts, contactSearch]);

  const selectedGroupCount = selectedGroupIds.length;
  const selectedContactCount = selectedContactIds.length;

  // ==========================================
  // TEMPLATE HANDLING
  // ==========================================

  const pickTemplate = (value) => {
    const selected = templates.find(
      (item) => `${item.name}|${item.language}` === value
    );

    setForm((previous) => ({
      ...previous,
      template: value,
      variables: Array(selected ? nVars(selected) : 0).fill(''),
    }));
  };

  const setVariable = (index, value) => {
    setForm((previous) => ({
      ...previous,
      variables: previous.variables.map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const preview = bodyOf(template).replace(
    /\{\{\s*(\d+)\s*\}\}/g,
    (_, key) =>
      (form.variables[Number(key) - 1] || `{{${key}}}`)
        .replaceAll('{{name}}', 'Asha')
  );

  const templatePayload = () => {
    const [templateName, language] = form.template.split('|');

    return {
      templateName,
      language,
      variables: form.variables,
    };
  };

  // ==========================================
  // CONTACT SELECTION
  // ==========================================

  const toggleContact = (id) => {
    setSelectedContactIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleGroup = (id) => {
    setSelectedGroupIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const selectAllVisible = () => {
    const ids = filteredContacts.map(getId).filter(Boolean);

    setSelectedContactIds((previous) => [
      ...new Set([...previous, ...ids]),
    ]);
  };

  // ==========================================
  // SEND CAMPAIGN
  // ==========================================

  const sendCampaign = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!form.name.trim()) {
      setMessage('Please enter a campaign name.');
      return;
    }

    if (!template) {
      setMessage('Please select an approved template.');
      return;
    }

    if (form.variables.some((value) => !value.trim())) {
      setMessage('Please fill in all template variables.');
      return;
    }

    let audiencePayload;

    if (audience === 'all') {
      if (!eligibleContacts.length) {
        setMessage('No opted-in contacts are available.');
        return;
      }

      audiencePayload = { type: 'all' };
    } else if (audience === 'group') {
      if (!selectedGroupIds.length) {
        setMessage('Select at least one contact group.');
        return;
      }

      audiencePayload = {
        type: 'group',
        groupIds: selectedGroupIds,
      };
    } else if (audience === 'selected') {
      if (!selectedContactIds.length) {
        setMessage('Select at least one contact.');
        return;
      }

      audiencePayload = {
        type: 'selected',
        contactIds: selectedContactIds,
      };
    } else {
      setMessage('Invalid campaign audience.');
      return;
    }

    setBusy(true);

    try {
      const result = await api.post('/campaigns', {
        name: form.name.trim(),
        ...templatePayload(),
        audience: audiencePayload,
      });

      setMessage(
        `Campaign started successfully. ${result.recipientCount ?? 0} eligible recipient(s) selected.`
      );

      setForm({
        name: '',
        template: '',
        variables: [],
      });

      setSelectedContactIds([]);
      setSelectedGroupIds([]);
      setAudience('all');
      setContactSearch('');

      setCampaignPage(1);
      await loadCampaigns();
    } catch (error) {
      setMessage(error.message || 'Unable to start campaign.');
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // TEST MESSAGE
  // ==========================================

  const sendTest = async () => {
    setMessage('');

    if (!template) {
      setMessage('Please select an approved template.');
      return;
    }

    if (!testPhone.trim()) {
      setMessage('Enter a test phone number.');
      return;
    }

    if (form.variables.some((value) => !value.trim())) {
      setMessage('Please fill in all template variables.');
      return;
    }

    setBusy(true);

    try {
      const result = await api.post('/campaigns/test', {
        ...templatePayload(),
        phone: testPhone,
      });

      setMessage(`Test message accepted. Message ID: ${result.id || 'Accepted'}`);
    } catch (error) {
      setMessage(error.message || 'Unable to send test message.');
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // CAMPAIGN PAGINATION
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(campaigns.length / PAGE_SIZE)
  );

  const currentPage = Math.min(campaignPage, totalPages);

  const visibleCampaigns = campaigns.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ==========================================
  // VALIDATION
  // ==========================================

  const buttonDisabled =
    busy ||
    loading ||
    contactsLoading ||
    !template ||
    !form.name.trim() ||
    form.variables.some((value) => !value.trim()) ||
    (audience === 'all' && eligibleContacts.length === 0) ||
    (audience === 'group' && !selectedGroupIds.length) ||
    (audience === 'selected' && !selectedContactIds.length);

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <PageHeader
        title="Campaigns"
        desc="Create WhatsApp campaigns and choose exactly who receives your messages."
      />

      {message && <Alert>{message}</Alert>}

      {templates.length === 0 && !loading && (
        <Alert>
          No approved WhatsApp templates found. Create a template
          and wait for APPROVED status.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* LEFT: CAMPAIGN FORM */}

        <form className="card space-y-5" onSubmit={sendCampaign}>
          <h2 className="text-lg font-semibold">New campaign</h2>

          {/* Campaign name */}

          <div>
            <label className="label" htmlFor="campaign-name">
              Campaign name
            </label>

            <input
              id="campaign-name"
              className="input"
              placeholder="Example: November promotion"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              required
            />
          </div>

          {/* Template */}

          <div>
            <label className="label" htmlFor="campaign-template">
              WhatsApp template
            </label>

            <select
              id="campaign-template"
              className="input"
              value={form.template}
              onChange={(event) => pickTemplate(event.target.value)}
              required
            >
              <option value="">Choose an approved template</option>

              {templates.map((item) => (
                <option
                  key={`${item.name}|${item.language}`}
                  value={`${item.name}|${item.language}`}
                >
                  {item.name} ({item.language})
                </option>
              ))}
            </select>
          </div>

          {/* Template variables */}

          {form.variables.map((value, index) => (
            <div key={index}>
              <label className="label">
                Template variable {'{{'}{index + 1}{'}}'}
              </label>

              <input
                className="input"
                placeholder={`Value for {{${index + 1}}}. Use {{name}} for contact names.`}
                value={value}
                onChange={(event) =>
                  setVariable(index, event.target.value)
                }
                required
              />
            </div>
          ))}

          {/* Audience */}

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="font-semibold">Choose campaign audience</h3>

            {[
              {
                value: 'all',
                title: 'All eligible contacts',
                description: 'Send to contacts with recorded WhatsApp opt-in consent.',
              },
              {
                value: 'group',
                title: 'Specific groups',
                description: 'Choose one or more saved contact groups.',
              },
              {
                value: 'selected',
                title: 'Selected contacts',
                description: 'Choose individual contacts for this campaign.',
              },
            ].map((item) => (
              <label
                key={item.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3"
              >
                <input
                  type="radio"
                  name="audience"
                  value={item.value}
                  checked={audience === item.value}
                  onChange={() => setAudience(item.value)}
                  className="mt-1"
                />

                <span>
                  <span className="block font-medium">
                    {item.title}
                  </span>

                  <span className="text-sm text-slate-500">
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* Group selection */}

          {audience === 'group' && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Select groups</h3>
                <Badge kind="info">{selectedGroupCount} selected</Badge>
              </div>

              {groups.length === 0 ? (
                <Empty
                  title="No groups available"
                  desc="Create a contact group on the Contacts page first."
                />
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const id = getId(group);

                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedGroupIds.includes(id)}
                            onChange={() => toggleGroup(id)}
                          />
                          <span className="font-medium">{group.name}</span>
                        </span>

                        <span className="text-sm text-slate-500">
                          {group.contactCount ??
                            group.contactIds?.length ??
                            0} contacts
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Individual contact selection */}

          {audience === 'selected' && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Select contacts</h3>
                <Badge kind="info">{selectedContactCount} selected</Badge>
              </div>

              <p className="text-xs text-slate-500">
                Showing opted-in contacts only. Total database contacts:
                {' '}{contactStats.total}.
              </p>

              <input
                className="input"
                placeholder="Search name or phone number"
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
              />

              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={selectAllVisible}
                  disabled={!filteredContacts.length}
                >
                  Select visible
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setSelectedContactIds([])}
                  disabled={!selectedContactIds.length}
                >
                  Clear selection
                </button>
              </div>

              {contactsLoading ? (
                <p className="text-sm text-slate-500">Loading contacts...</p>
              ) : filteredContacts.length === 0 ? (
                <Empty
                  title="No eligible contacts found"
                  desc="Only contacts with recorded opt-in consent are selectable."
                />
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {filteredContacts.map((contact) => {
                    const id = getId(contact);

                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-3 rounded-md bg-slate-50 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(id)}
                          onChange={() => toggleContact(id)}
                        />

                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {contact.name || 'Unnamed contact'}
                          </span>

                          <span className="text-sm text-slate-500">
                            {contact.phone}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Test message */}

          {template && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <label className="label" htmlFor="test-phone">
                Test message number
              </label>

              <div className="flex flex-wrap gap-2">
                <input
                  id="test-phone"
                  className="input min-w-0 flex-1"
                  placeholder="Number with country code"
                  value={testPhone}
                  onChange={(event) => setTestPhone(event.target.value)}
                />

                <button
                  type="button"
                  className="btn-ghost"
                  disabled={
                    busy ||
                    !testPhone.trim() ||
                    form.variables.some((value) => !value.trim())
                  }
                  onClick={sendTest}
                >
                  Send test
                </button>
              </div>
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            className="btn w-full sm:w-auto"
            disabled={buttonDisabled}
          >
            {busy
              ? 'Please wait...'
              : audience === 'all'
                ? 'Send to all eligible contacts'
                : 'Send campaign'}
          </button>

          {!busy && !template && (
            <p className="text-xs text-amber-600">
              Select an approved WhatsApp template to continue.
            </p>
          )}

          {audience === 'all' && !contactsLoading &&
            eligibleContacts.length === 0 && (
              <p className="text-xs text-amber-600">
                No opted-in contacts are available for sending.
              </p>
            )}
        </form>

        {/* RIGHT SIDEBAR */}

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* Preview */}

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Message preview
            </h2>

            <div className="rounded-lg bg-[#efeae2] p-4">
              <Bubble>
                {template
                  ? preview
                  : 'Choose an approved template to preview your message.'}
              </Bubble>
            </div>
          </div>

          {/* Contact statistics */}

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Contact overview</h2>
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={loadInitialData}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-2xl font-semibold">
                  {contactsLoading ? '...' : contactStats.total}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-green-600">
                  {contactsLoading ? '...' : contactStats.optedIn}
                </p>
                <p className="text-xs text-slate-500">Opted in</p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-amber-600">
                  {contactsLoading ? '...' : contactStats.notOptedIn}
                </p>
                <p className="text-xs text-slate-500">No consent</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-3">
              <h3 className="font-medium">Audience summary</h3>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Audience type</span>
                <span className="font-medium">
                  {audience === 'all'
                    ? 'All eligible'
                    : audience === 'group'
                      ? 'Selected groups'
                      : 'Selected contacts'}
                </span>
              </div>

              {audience === 'all' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Eligible recipients</span>
                  <span className="font-semibold">
                    {contactsLoading ? '...' : eligibleContacts.length}
                  </span>
                </div>
              )}

              {audience === 'group' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Groups selected</span>
                  <span className="font-semibold">{selectedGroupCount}</span>
                </div>
              )}

              {audience === 'selected' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Contacts selected</span>
                  <span className="font-semibold">{selectedContactCount}</span>
                </div>
              )}
            </div>

            <p className="border-t border-slate-200 pt-2 text-xs text-slate-500">
              Only contacts with recorded WhatsApp opt-in consent
              can receive campaign messages.
            </p>
          </div>
        </aside>
      </div>

      {/* CAMPAIGN HISTORY */}

      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Campaign results</h2>
            <p className="text-sm text-slate-500">
              {campaigns.length} campaign(s) in your history.
            </p>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={loadCampaigns}
          >
            Refresh results
          </button>
        </div>

        {campaigns.length === 0 ? (
          <Empty
            title="No campaigns yet"
            desc="Your campaign results will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Campaign</th>
                    <th className="th">Template</th>
                    <th className="th">Audience</th>
                    <th className="th">Status</th>
                    <th className="th">Sent</th>
                    <th className="th">Delivered</th>
                    <th className="th">Read</th>
                    <th className="th">Failed</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCampaigns.map((campaign) => (
                    <tr key={getId(campaign)}>
                      <td className="td font-medium text-slate-900">
                        {campaign.name}
                      </td>

                      <td className="td">
                        {campaign.templateName}
                      </td>

                      <td className="td">
                        {campaign.audienceType || 'all'}
                      </td>

                      <td className="td">
                        <Badge kind={kindOf(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </td>

                      <td className="td">
                        {count(campaign, 'sent', 'delivered', 'read')}/
                        {(campaign.messages || []).length}
                      </td>

                      <td className="td">
                        {count(campaign, 'delivered', 'read')}
                      </td>

                      <td className="td">
                        {count(campaign, 'read')}
                      </td>

                      <td className="td">
                        {count(campaign, 'failed')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, campaigns.length)}
                {' '}of {campaigns.length}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={currentPage === 1}
                  onClick={() => setCampaignPage((page) => page - 1)}
                >
                  Previous
                </button>

                <span className="flex items-center px-3 text-sm">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  className="btn-ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCampaignPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
