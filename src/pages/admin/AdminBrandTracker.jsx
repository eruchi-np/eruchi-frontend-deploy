import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
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
  const [reloadToken, setReloadToken] = useState(0);

  const applyCategoryBrands = (list, nextCategory, currentBrand, currentSelected) => {
    const saved = list.find((item) => item.category === nextCategory) || list[0];
    if (!saved) return null;
    const nextBrand = saved.brands.includes(currentBrand) ? currentBrand : (saved.brands[0] || '');
    const nextSelected = (currentSelected.length ? currentSelected : [nextBrand])
      .filter((name) => saved.brands.includes(name));
    return {
      category: saved.category,
      brand: nextBrand,
      selected: nextSelected.length ? nextSelected : (nextBrand ? [nextBrand] : []),
    };
  };

  const CATEGORY_ORDER = [
    { category: 'FB', label: 'Functional Beverages' },
    { category: 'PC', label: 'Personal Care' },
  ];

  // Always keep FB + PC so the switcher never disappears when live only has one.
  const categoriesFromStatus = (data) => {
    const byCat = new Map();
    const ingest = (list) => {
      (list || []).forEach((item) => {
        if (!item?.category) return;
        const prev = byCat.get(item.category) || {
          category: item.category,
          label: item.label || item.category,
          brands: [],
        };
        if (item.label) prev.label = item.label;
        prev.brands = [...new Set([...prev.brands, ...(item.brands || [])])];
        byCat.set(item.category, prev);
      });
    };
    ingest(data.categories);
    ingest(data.live);
    ingest(data.sample);
    return CATEGORY_ORDER.map((base) => {
      const hit = byCat.get(base.category);
      return {
        category: base.category,
        label: hit?.label || base.label,
        brands: [...new Set(hit?.brands || [])].sort(),
      };
    });
  };

  const refreshStatus = () => {
    adminAPI.getBrandMetricsStatus({ skipErrorToast: true })
      .then(({ data }) => {
        setStatus(data);
        const list = categoriesFromStatus(data);
        if (!list.length) return;
        setCategories(list);
        const applied = applyCategoryBrands(list, category, brand, selected);
        if (!applied) return;
        setCategory(applied.category);
        setBrand(applied.brand);
        setSelected(applied.selected);
        setReloadToken((value) => value + 1);
      })
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    adminAPI.getBrandMetricsStatus({ skipErrorToast: true })
      .then(({ data }) => {
        setStatus(data);
        const list = categoriesFromStatus(data);
        setCategories(list);
        const saved = list.find((item) => item.category === category) || list.find((item) => item.category === 'FB') || list[0];
        if (!saved) {
          setError('No brands found in the metrics database for this category.');
          return;
        }
        setCategory(saved.category);
        const nextBrand = saved.brands.includes(brand) ? brand : (saved.brands[0] || '');
        setBrand(nextBrand);
        const nextSelected = (selected.length ? selected : [nextBrand]).filter((name) => saved.brands.includes(name));
        setSelected(nextSelected.length ? nextSelected : (nextBrand ? [nextBrand] : []));
        setReloadToken((value) => value + 1);
      })
      .catch(() => setError('Could not load the brand list.'));
  }, []);

  useEffect(() => {
    writeAdminPrefs({ category, mode, brand, selected });
  }, [category, mode, brand, selected]);

  const current = categories.find((item) => item.category === category);
  // Live brands first; sample only if live has none for this category.
  const brands = (() => {
    const liveBrands = status?.live?.find((item) => item.category === category)?.brands;
    if (liveBrands?.length) return [...new Set(liveBrands)];
    if (current?.brands?.length) return [...new Set(current.brands)];
    const sampleBrands = status?.sample?.find((item) => item.category === category)?.brands;
    return sampleBrands?.length ? [...new Set(sampleBrands)] : [];
  })();

  const brandsKey = brands.join('|');
  useEffect(() => {
    if (!brands.length) return;
    setBrand((currentBrand) => (brands.includes(currentBrand) ? currentBrand : brands[0]));
    setSelected((currentSelected) => {
      const next = currentSelected.filter((name) => brands.includes(name));
      if (next.length) {
        if (next.length === currentSelected.length && next.every((name, index) => name === currentSelected[index])) {
          return currentSelected;
        }
        return next;
      }
      return brands[0] ? [brands[0]] : [];
    });
  }, [category, brandsKey]);

  const brandsForCategory = (nextCategory) => {
    const liveBrands = status?.live?.find((item) => item.category === nextCategory)?.brands;
    if (liveBrands?.length) return [...new Set(liveBrands)];
    const listed = categories.find((item) => item.category === nextCategory)?.brands;
    if (listed?.length) return [...new Set(listed)];
    const sampleBrands = status?.sample?.find((item) => item.category === nextCategory)?.brands;
    return sampleBrands?.length ? [...new Set(sampleBrands)] : [];
  };

  const onCategory = (next) => {
    const nextBrands = brandsForCategory(next);
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
    if (!brands.includes(name)) return;
    setBrand(name);
    if (mode === 'selected' && !selected.includes(name)) {
      setSelected((currentSelected) => [...currentSelected, name]);
    }
  };

  /** Chart / chip click → One mode with only that brand's data. */
  const onSelectOneBrand = (name) => {
    if (!brands.includes(name)) return;
    setMode('one');
    setBrand(name);
  };

  const toggleSelected = (name) => {
    if (!brands.includes(name) && !selected.includes(name)) return;
    setSelected((currentSelected) => {
      if (currentSelected.includes(name)) {
        const next = currentSelected.filter((item) => item !== name);
        setBrand(next[0] || '');
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
      setReloadToken((value) => value + 1);
    } catch (err) {
      setImportMsg(err.response?.data?.message || 'Import failed');
    } finally {
      setImportBusy(false);
    }
  };

  if (error) {
    return <p className="py-24 text-center text-sm text-rose-600">{error}</p>;
  }
  if (!current || (mode === 'one' && !brand)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedBrands = mode === 'all'
    ? [brand, ...brands.filter((name) => name !== brand)]
    : mode === 'selected'
      ? [...new Set(
        (selected.includes(brand) ? [brand, ...selected.filter((name) => name !== brand)] : selected)
          .filter((name) => brands.includes(name)),
      )]
      : null;
  const apiBrand = mode === 'one' ? brand : (selectedBrands?.[0] || brand);
  const liveForCategory = status?.live?.find((item) => item.category === category);
  const primaryRows = liveForCategory?.rows || 0;

  const toolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-700">
        <p className="font-medium text-gray-900">
          Charts use live DB ({primaryRows ? `${primaryRows} rows` : 'loading…'}) — {current.label}
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
  );

  return (
    <BrandDashboard
      key={`${category}:${mode}:${mode === 'one' ? brand : 'multi'}:${reloadToken}:live`}
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
        onSelectOneBrand,
        onToggleSelected: toggleSelected,
        onFocusSelected: focusSelected,
        toolbar,
        dataSource: 'live',
        fetchMetrics: (metrics) => adminAPI.getBrandMetrics(category, apiBrand, metrics, { skipErrorToast: true }),
      }}
    />
  );
}
