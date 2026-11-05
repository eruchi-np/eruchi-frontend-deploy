import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';

const emptyForm = {
  name: '',
  domains: '',
  approvedEmails: '',
  notes: '',
  active: true,
};

const toLines = (text) => String(text || '')
  .split(/[\n,]+/)
  .map((item) => item.trim())
  .filter(Boolean);

export default function InsightsCompanies() {
  const adminAPI = useInsightsApi();
  const [companies, setCompanies] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => adminAPI.listInsightCompanies({ skipErrorToast: true })
    .then(({ data }) => setCompanies(data.companies || []))
    .catch(() => toast.error('Could not load companies'));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing({ id: null });
    setForm(emptyForm);
  };

  const openEdit = (company) => {
    setEditing(company);
    setForm({
      name: company.name || '',
      domains: (company.domains || []).join('\n'),
      approvedEmails: (company.approvedEmails || []).join('\n'),
      notes: company.notes || '',
      active: company.active !== false,
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      domains: toLines(form.domains),
      approvedEmails: toLines(form.approvedEmails).slice(0, 10),
      notes: form.notes,
      active: form.active,
    };
    try {
      if (editing?.id) {
        await adminAPI.updateInsightCompany(editing.id, payload, { skipErrorToast: true });
        toast.success('Company updated');
      } else {
        await adminAPI.createInsightCompany(payload, { skipErrorToast: true });
        toast.success('Company created');
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save company');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (company) => {
    if (!window.confirm(`Delete ${company.name}? Brands stay, but unlink from this company.`)) return;
    try {
      await adminAPI.deleteInsightCompany(company.id, { skipErrorToast: true });
      toast.success('Company deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const toggleActive = async (company) => {
    try {
      await adminAPI.updateInsightCompany(company.id, { active: !company.active }, { skipErrorToast: true });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Companies</h2>
        <div className="ri-admin-actions">
          <button type="button" className="ri-admin-btn ri-admin-btn-primary" onClick={openCreate}>Add company</button>
        </div>
      </div>

      <div className="ri-admin-card overflow-x-auto">
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Domains</th>
              <th>Approved emails</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>
                  <div className="font-semibold text-gray-900">{company.name}</div>
                  {company.notes ? <div className="mt-1 text-xs text-gray-500">{company.notes}</div> : null}
                </td>
                <td className="text-xs text-gray-600">{(company.domains || []).join(', ') || '—'}</td>
                <td className="text-xs text-gray-600">{(company.approvedEmails || []).join(', ') || '—'}</td>
                <td>
                  <span className={`ri-admin-pill ${company.active ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                    {company.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="ri-admin-actions justify-end">
                    <button type="button" className="ri-admin-btn" onClick={() => openEdit(company)}>Edit</button>
                    <button type="button" className="ri-admin-btn" onClick={() => toggleActive(company)}>
                      {company.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="ri-admin-btn ri-admin-btn-danger" onClick={() => remove(company)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!companies.length ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No companies yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="ri-admin-modal">
          <div className="ri-admin-modal-card">
            <div className="ri-admin-toolbar">
              <h2>{editing.id ? 'Edit company' : 'Add company'}</h2>
              <button type="button" className="ri-admin-btn" onClick={() => setEditing(null)}>Close</button>
            </div>
            <form className="ri-admin-form" onSubmit={save}>
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </label>
              <label>
                Domains (one per line, max useful for invite matching)
                <textarea value={form.domains} onChange={(e) => setForm((f) => ({ ...f, domains: e.target.value }))} placeholder="acme.com" />
              </label>
              <label>
                Approved emails (max 10, one per line)
                <textarea value={form.approvedEmails} onChange={(e) => setForm((f) => ({ ...f, approvedEmails: e.target.value }))} placeholder="name@acme.com" />
              </label>
              <label>
                Notes
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </label>
              <label className="!flex !flex-row items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active (deactivating also deactivates linked brands)
              </label>
              <div className="ri-admin-actions justify-end">
                <button type="button" className="ri-admin-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="ri-admin-btn ri-admin-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
