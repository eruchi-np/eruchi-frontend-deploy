import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';

export default function InsightsUsers() {
  const adminAPI = useInsightsApi();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [busy, setBusy] = useState(false);
  const [linkModal, setLinkModal] = useState(null);
  const [form, setForm] = useState({
    companyId: '',
    email: '',
    brand: '',
    category: 'FB',
    sendEmail: true,
  });

  const companyBrands = useMemo(
    () => brands.filter((item) => !form.category || item.category === form.category),
    [brands, form.category],
  );

  const load = async () => {
    try {
      const [usersRes, invitesRes, companiesRes, brandsRes] = await Promise.all([
        adminAPI.listInsightUsers({ skipErrorToast: true }),
        adminAPI.listInsightInvites({}, { skipErrorToast: true }),
        adminAPI.listInsightCompanies({ skipErrorToast: true }),
        adminAPI.listInsightBrands({}, { skipErrorToast: true }),
      ]);
      setUsers(usersRes.data.users || []);
      setInvites(invitesRes.data.invites || []);
      setCompanies(companiesRes.data.companies || []);
      setBrands(brandsRes.data.brands || []);
    } catch {
      toast.error('Could not load users / invites');
    }
  };

  useEffect(() => { load(); }, []);

  const openInvite = () => {
    setForm({
      companyId: companies[0]?.id || '',
      email: '',
      brand: '',
      category: 'FB',
      sendEmail: true,
    });
    setLinkModal({ kind: 'create' });
  };

  const createInvite = async (event) => {
    event.preventDefault();
    if (!form.companyId) {
      toast.error('Choose a company');
      return;
    }
    setBusy(true);
    try {
      const { data } = await adminAPI.createActivateInvite({
        companyId: form.companyId,
        email: form.email.trim() || undefined,
        brand: form.brand || undefined,
        category: form.brand ? form.category : undefined,
        sendEmail: Boolean(form.sendEmail && form.email.trim()),
      }, { skipErrorToast: true });
      setLinkModal({ kind: 'result', url: data.url, label: 'Activate link' });
      await load();
      if (data.emailed) toast.success('Invite created and emailed');
      else if (data.emailError) toast.success('Invite created (email failed — copy the link)');
      else toast.success('Invite created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create invite');
    } finally {
      setBusy(false);
    }
  };

  const createReset = async (user) => {
    setBusy(true);
    try {
      const { data } = await adminAPI.createResetInvite({
        userId: user.id,
        sendEmail: true,
      }, { skipErrorToast: true });
      setLinkModal({ kind: 'result', url: data.url, label: 'Reset link' });
      await load();
      if (data.emailed) toast.success('Reset link emailed');
      else if (data.emailError) toast.success('Reset link ready (email failed — copy it)');
      else toast.success('Reset link ready');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create reset link');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (invite) => {
    try {
      await adminAPI.revokeInsightInvite(invite.id, { skipErrorToast: true });
      toast.success('Invite revoked');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not revoke');
    }
  };

  const toggleUser = async (user) => {
    try {
      await adminAPI.updateInsightUser(user.id, { active: !user.active }, { skipErrorToast: true });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user');
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Users / invites</h2>
        <div className="ri-admin-actions">
          <button type="button" className="ri-admin-btn ri-admin-btn-primary" onClick={openInvite}>
            New activate invite
          </button>
        </div>
      </div>

      <div className="ri-admin-card overflow-x-auto mb-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Portal users</h3>
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Brand</th>
              <th>Company</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="font-semibold text-gray-900">{user.name || '—'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  {user.title ? <div className="text-xs text-gray-400">{user.title}</div> : null}
                </td>
                <td>
                  <div>{user.brand}</div>
                  <div className="text-xs text-gray-500">{user.categoryLabel}</div>
                </td>
                <td>{user.companyName || '—'}</td>
                <td>
                  <span className={`ri-admin-pill ${user.active ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                    {user.active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td>
                  <div className="ri-admin-actions justify-end">
                    <button type="button" className="ri-admin-btn" disabled={busy} onClick={() => createReset(user)}>
                      Reset link
                    </button>
                    <button type="button" className="ri-admin-btn" onClick={() => toggleUser(user)}>
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No portal users yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="ri-admin-card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Invites</h3>
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Company / email</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Expires</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td className="capitalize">{invite.type}</td>
                <td>
                  <div>{invite.companyName || '—'}</div>
                  <div className="text-xs text-gray-500">{invite.email || 'Any approved email'}</div>
                </td>
                <td>{invite.brand || '—'}</td>
                <td>
                  <span className={`ri-admin-pill ${invite.status === 'active' ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                    {invite.status}
                  </span>
                </td>
                <td className="text-xs text-gray-500">
                  {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : '—'}
                </td>
                <td>
                  {invite.status === 'active' && invite.type === 'activate' ? (
                    <button type="button" className="ri-admin-btn ri-admin-btn-danger" onClick={() => revoke(invite)}>
                      Revoke
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!invites.length ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">No invites yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {linkModal?.kind === 'create' ? (
        <div className="ri-admin-modal">
          <div className="ri-admin-modal-card">
            <div className="ri-admin-toolbar">
              <h2>New activate invite</h2>
              <button type="button" className="ri-admin-btn" onClick={() => setLinkModal(null)}>Close</button>
            </div>
            <form className="ri-admin-form" onSubmit={createInvite}>
              <label>
                Company
                <select
                  value={form.companyId}
                  onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                  required
                >
                  <option value="">Select…</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Lock to email (optional)
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@company.com"
                />
              </label>
              <label>
                Category
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, brand: '' }))}>
                  <option value="FB">Functional Beverages</option>
                  <option value="PC">Personal Care</option>
                </select>
              </label>
              <label>
                Primary brand (optional)
                <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}>
                  <option value="">Choose at activation</option>
                  {companyBrands.map((brand) => (
                    <option key={`${brand.category}-${brand.name}`} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 !grid-cols-none">
                <input
                  type="checkbox"
                  checked={Boolean(form.sendEmail)}
                  disabled={!form.email.trim()}
                  onChange={(e) => setForm((f) => ({ ...f, sendEmail: e.target.checked }))}
                />
                <span>Email the activate link (needs lock-to email)</span>
              </label>
              <div className="ri-admin-actions justify-end">
                <button type="button" className="ri-admin-btn" onClick={() => setLinkModal(null)}>Cancel</button>
                <button type="submit" className="ri-admin-btn ri-admin-btn-primary" disabled={busy}>
                  {busy ? 'Creating…' : 'Create invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {linkModal?.kind === 'result' ? (
        <div className="ri-admin-modal">
          <div className="ri-admin-modal-card">
            <div className="ri-admin-toolbar">
              <h2>{linkModal.label}</h2>
              <button type="button" className="ri-admin-btn" onClick={() => setLinkModal(null)}>Close</button>
            </div>
            <p className="mb-2 text-sm text-gray-600">Copy and share this one-time link now. It is not shown again.</p>
            <textarea className="w-full rounded-lg border border-gray-200 p-3 text-xs" readOnly rows={4} value={linkModal.url} />
            <div className="ri-admin-actions mt-3 justify-end">
              <button type="button" className="ri-admin-btn ri-admin-btn-primary" onClick={() => copy(linkModal.url)}>
                Copy link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
