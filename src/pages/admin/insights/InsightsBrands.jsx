import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';

const CATALOG_COLORS = {
  'Red Bull': '#DB0A40',
  'X-treme': '#6B2D8B',
  'Max Tiger': '#F5A623',
  Monster: '#8BC53F',
  Sting: '#F5C518',
  Dove: '#003591',
  Pantene: '#C9A227',
  Himalaya: '#006B3F',
  "L'Oréal": '#1A1A1A',
  "Pond's": '#E8A0BF',
  Nivea: '#001489',
  Garnier: '#009639',
  Sunsilk: '#7B2D8E',
  'Clinic Plus': '#E31837',
  Mamaearth: '#7CB342',
  Biotique: '#2E7D32',
  Parachute: '#1565C0',
};

const emptyForm = {
  name: '',
  category: 'FB',
  companyId: '',
  logoUrl: '',
  color: '#DB0A40',
  sortOrder: 0,
  active: true,
};

export default function InsightsBrands() {
  const adminAPI = useInsightsApi();
  const [brands, setBrands] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const companyName = useMemo(() => {
    const map = new Map(companies.map((item) => [item.id, item.name]));
    return (id) => (id ? map.get(id) || '—' : '—');
  }, [companies]);

  const load = async () => {
    try {
      const [brandRes, companyRes] = await Promise.all([
        adminAPI.listInsightBrands(
          category === 'ALL' ? {} : { category },
          { skipErrorToast: true },
        ),
        adminAPI.listInsightCompanies({ skipErrorToast: true }),
      ]);
      setBrands(brandRes.data.brands || []);
      setCompanies(companyRes.data.companies || []);
    } catch {
      toast.error('Could not load brands');
    }
  };

  useEffect(() => { load(); }, [category]);

  const openCreate = () => {
    setEditing({ id: null });
    setForm({ ...emptyForm, category: category === 'PC' ? 'PC' : 'FB' });
  };

  const openEdit = (brand) => {
    setEditing(brand);
    setForm({
      name: brand.name || '',
      category: brand.category || 'FB',
      companyId: brand.companyId || '',
      logoUrl: brand.logoUrl || '',
      color: brand.color || '#3399ff',
      sortOrder: brand.sortOrder || 0,
      active: brand.active !== false,
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      companyId: form.companyId || null,
      logoUrl: form.logoUrl.trim(),
      color: form.color,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editing?.id) {
        await adminAPI.updateInsightBrand(editing.id, payload, { skipErrorToast: true });
        toast.success('Brand updated');
      } else {
        await adminAPI.createInsightBrand(payload, { skipErrorToast: true });
        toast.success('Brand created');
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save brand');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (brand) => {
    if (!window.confirm(`Delete ${brand.name}?`)) return;
    try {
      await adminAPI.deleteInsightBrand(brand.id, { skipErrorToast: true });
      toast.success('Brand deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const toggleActive = async (brand) => {
    try {
      await adminAPI.updateInsightBrand(brand.id, { active: !brand.active }, { skipErrorToast: true });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  const seed = async () => {
    setBusy(true);
    try {
      const { data } = await adminAPI.seedInsightBrands({ skipErrorToast: true });
      toast.success(`Seeded catalog (${data.upserted || 0} new, ${data.modified || 0} colors refreshed)`);
      setBrands(data.brands || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not seed brands');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Brands</h2>
        <div className="ri-admin-actions">
          <select
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">All categories</option>
            <option value="FB">Functional Beverages</option>
            <option value="PC">Personal Care</option>
          </select>
          <button type="button" className="ri-admin-btn" onClick={seed} disabled={busy}>Seed from catalog</button>
          <button type="button" className="ri-admin-btn ri-admin-btn-primary" onClick={openCreate}>Add brand</button>
        </div>
      </div>

      <div className="ri-admin-card overflow-x-auto">
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Category</th>
              <th>Company</th>
              <th>Order</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td>
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <span className="ri-admin-swatch" style={{ background: brand.color || '#3399ff' }} />
                    {brand.name}
                  </div>
                  {brand.logoUrl ? <div className="mt-1 truncate text-xs text-gray-500">{brand.logoUrl}</div> : null}
                </td>
                <td>{brand.categoryLabel || brand.category}</td>
                <td>{companyName(brand.companyId)}</td>
                <td>{brand.sortOrder}</td>
                <td>
                  <span className={`ri-admin-pill ${brand.active ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                    {brand.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="ri-admin-actions justify-end">
                    <button type="button" className="ri-admin-btn" onClick={() => openEdit(brand)}>Edit</button>
                    <button type="button" className="ri-admin-btn" onClick={() => toggleActive(brand)}>
                      {brand.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="ri-admin-btn ri-admin-btn-danger" onClick={() => remove(brand)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!brands.length ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No brands yet. Seed from the live catalog or add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="ri-admin-modal">
          <div className="ri-admin-modal-card">
            <div className="ri-admin-toolbar">
              <h2>{editing.id ? 'Edit brand' : 'Add brand'}</h2>
              <button type="button" className="ri-admin-btn" onClick={() => setEditing(null)}>Close</button>
            </div>
            <form className="ri-admin-form" onSubmit={save}>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      color: CATALOG_COLORS[name] || f.color,
                    }));
                  }}
                  required
                />
              </label>
              <label>
                Category
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="FB">Functional Beverages</option>
                  <option value="PC">Personal Care</option>
                </select>
              </label>
              <label>
                Company
                <select value={form.companyId} onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Logo URL
                <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://…" />
              </label>
              <label>
                Color
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
              </label>
              <label>
                Sort order
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              </label>
              <label className="!flex !flex-row items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active
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
