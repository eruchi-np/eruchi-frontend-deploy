import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAPI, brandAPI } from '../../services/api';
import BrandDashboard from '../brand/BrandDashboard';
import { readAdminPrefs, writeAdminPrefs } from '../brand/brandViewState';

const MODES = [
  { id: 'one', label: 'One' },
  { id: 'selected', label: 'Selected' },
  { id: 'all', label: 'All' },
];

export default function AdminBrandTracker() {
  const prefs = readAdminPrefs();
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(prefs.category === 'PC' ? 'PC' : 'FB');
  const [mode, setMode] = useState(['one', 'selected', 'all'].includes(prefs.mode) ? prefs.mode : 'one');
  const [brand, setBrand] = useState(prefs.brand || '');
  const [selected, setSelected] = useState(Array.isArray(prefs.selected) ? prefs.selected : []);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [importMsg, setImportMsg] = useState('');
  const [importBusy, setImportBusy] = useState(false);

  const refreshStatus = () => {
    adminAPI.getBrandMetricsStatus({ skipErrorToast: true })
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    brandAPI.catalog({ skipErrorToast: true })
      .then(({ data }) => {
        const list = data.categories || [];
        setCategories(list);
        const saved = list.find((item) => item.category === category) || list.find((item) => item.category === 'FB') || list[0];
        if (!saved) return;
        setCategory(saved.category);
        const nextBrand = saved.brands.includes(brand) ? brand : (saved.brands[0] || '');
        setBrand(nextBrand);
        const nextSelected = (selected.length ? selected : [nextBrand]).filter((name) => saved.brands.includes(name));
        setSelected(nextSelected.length ? nextSelected : (nextBrand ? [nextBrand] : []));
      })
      .catch(() => setError('Could not load the brand list.'));
    refreshStatus();
  }, []);

  useEffect(() => {
    writeAdminPrefs({ category, mode, brand, selected });
  }, [category, mode, brand, selected]);

  const current = categories.find((item) => item.category === category);
  const brands = current?.brands || [];

  const onCategory = (next) => {
    const found = categories.find((item) => item.category === next);
    const nextBrands = found?.brands || [];
    setCategory(next);
    setBrand(nextBrands[0] || '');
    setSelected(nextBrands[0] ? [nextBrands[0]] : []);
  };

  const onMode = (next) => {
    setMode(next);
    if (next === 'all') {
      setSelected(brands);
      setBrand(brands[0] || '');
    } else if (next === 'selected') {
      const keep = selected.length ? selected.filter((name) => brands.includes(name)) : (brand ? [brand] : []);
      const nextSelected = keep.length ? keep : (brands[0] ? [brands[0]] : []);
      setSelected(nextSelected);
      setBrand(nextSelected[0] || '');
    }
  };

  const onBrand = (name) => {
    setBrand(name);
    if (mode === 'selected' && !selected.includes(name)) {
      setSelected((currentSelected) => [...currentSelected, name]);
    }
  };

  const toggleSelected = (name) => {
    setSelected((currentSelected) => {
      if (currentSelected.includes(name)) {
        if (currentSelected.length <= 1) return currentSelected;
        const next = currentSelected.filter((item) => item !== name);
        if (!next.includes(brand)) setBrand(next[0] || '');
        return next;
      }
      return [...currentSelected, name];
    });
  };

  const focusSelected = (name) => {
    setBrand(name);
    if (mode === 'selected') {
      setSelected((currentSelected) => {
        if (!currentSelected.includes(name)) return currentSelected;
        return [name, ...currentSelected.filter((item) => item !== name)];
      });
    }
  };

  const downloadTemplate = () => {
    if (!status?.csvHeaders || !status?.templateRow) return;
    const headers = status.csvHeaders;
    const row = headers.map((key) => {
      const value = status.templateRow[key];
      const text = value == null ? '' : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    });
    const body = `${headers.join(',')}\n${row.join(',')}\n`;
    const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brand-metrics-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportBusy(true);
    setImportMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await adminAPI.importBrandMetricsCsv(formData, { skipErrorToast: true });
      setImportMsg(data.message || 'Import complete');
      refreshStatus();
    } catch (err) {
      setImportMsg(err.response?.data?.message || 'Import failed');
    } finally {
      setImportBusy(false);
    }
  };

  if (error) {
    return <p className="py-24 text-center text-sm text-rose-600">{error}</p>;
  }
  if (!brand || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedBrands = mode === 'all'
    ? [brand, ...brands.filter((name) => name !== brand)]
    : mode === 'selected'
      ? (selected.includes(brand) ? [brand, ...selected.filter((name) => name !== brand)] : selected)
      : null;
  const apiBrand = mode === 'one' ? brand : (selectedBrands?.[0] || brand);
  const liveForCategory = status?.live?.find((item) => item.category === category);
  const sampleForCategory = status?.sample?.find((item) => item.category === category);
  const usingLive = Boolean(liveForCategory?.rows);

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <p className="font-medium text-gray-900">
              Data source: {usingLive ? 'Live' : 'Sample'}
            </p>
            <p className="text-xs text-gray-500">
              Live {liveForCategory?.rows || 0} rows · Sample {sampleForCategory?.rows || 0} rows for {current.label}
            </p>
            {importMsg ? <p className="mt-1 text-xs text-blue-700">{importMsg}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-slate-50"
            >
              CSV template
            </button>
            <button
              type="button"
              disabled={importBusy}
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importBusy ? 'Importing...' : 'Import live CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
          </div>
        </div>
      </div>
      <BrandDashboard
        key={`${category}:${mode}:${mode === 'one' ? brand : 'multi'}`}
        viewer={{
          mode,
          modes: MODES,
          onMode,
          category,
          categoryLabel: current.label,
          brand: apiBrand,
          brands,
          selectedBrands,
          categories,
          onCategory,
          onBrand,
          onToggleSelected: toggleSelected,
          onFocusSelected: focusSelected,
          fetchMetrics: (metrics) => adminAPI.getBrandMetrics(category, apiBrand, metrics, { skipErrorToast: true }),
        }}
      />
    </div>
  );
}
