import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandDashboard from './BrandDashboard';
import { readAdminPrefs, writeAdminPrefs } from './brandViewState';

const MODES = [
  { id: 'one', label: 'One' },
  { id: 'selected', label: 'Selected' },
  { id: 'all', label: 'All' },
];

const CATEGORY_ORDER = [
  { category: 'FB', label: 'Functional Beverages' },
  { category: 'PC', label: 'Personal Care' },
];

/**
 * Analytics staff signed in via /brand/login — metrics + insights only (no CSV import).
 */
export default function BrandStaffViewer({ client }) {
  const navigate = useNavigate();
  const prefs = readAdminPrefs();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(prefs.category === 'PC' ? 'PC' : 'FB');
  const [mode, setMode] = useState(['one', 'selected', 'all'].includes(prefs.mode) ? prefs.mode : 'one');
  const [brand, setBrand] = useState(prefs.brand || '');
  const [selected, setSelected] = useState(Array.isArray(prefs.selected) ? prefs.selected : []);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [booting, setBooting] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

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
    return CATEGORY_ORDER.map((base) => {
      const hit = byCat.get(base.category);
      return {
        category: base.category,
        label: hit?.label || base.label,
        brands: [...new Set(hit?.brands || [])].sort(),
      };
    });
  };

  useEffect(() => {
    brandAPI.staffMetricsStatus({ skipErrorToast: true, skipAuthRedirect: true })
      .then(({ data }) => {
        setStatus(data);
        const list = categoriesFromStatus(data);
        setCategories(list);
        const saved = list.find((item) => item.category === category)
          || list.find((item) => item.category === 'FB')
          || list[0];
        if (!saved) {
          setError('No brands found in live metrics yet.');
          return;
        }
        setCategory(saved.category);
        const nextBrand = saved.brands.includes(brand) ? brand : (saved.brands[0] || '');
        setBrand(nextBrand);
        const nextSelected = (selected.length ? selected : [nextBrand])
          .filter((name) => saved.brands.includes(name));
        setSelected(nextSelected.length ? nextSelected : (nextBrand ? [nextBrand] : []));
        setReloadToken((value) => value + 1);
      })
      .catch(() => setError('Could not load metrics for staff viewer.'))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    writeAdminPrefs({ category, mode, brand, selected });
  }, [category, mode, brand, selected]);

  const current = categories.find((item) => item.category === category);
  const brands = (() => {
    const liveBrands = status?.live?.find((item) => item.category === category)?.brands;
    if (liveBrands?.length) return [...new Set(liveBrands)];
    if (current?.brands?.length) return [...new Set(current.brands)];
    return [];
  })();

  if (error) {
    return (
      <div className="ruchi-insights flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-[var(--bad)]">{error}</p>
        <button type="button" className="ri-auth-btn" onClick={() => navigate('/brand/login')}>Back to sign in</button>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="ruchi-insights flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--ink-3)]" />
      </div>
    );
  }

  if (!brands.length || !brand) {
    return (
      <div className="ruchi-insights flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold text-[var(--ink)]">No brands in live metrics yet</p>
        <p className="max-w-md text-sm text-[var(--ink-2)]">
          Import or publish metrics for {current?.label || 'this category'} first, then reopen the staff viewer.
        </p>
        <button type="button" className="ri-auth-btn" onClick={() => navigate('/brand/login')}>Back to sign in</button>
      </div>
    );
  }

  const onCategory = (next) => {
    const saved = categories.find((item) => item.category === next) || categories[0];
    if (!saved) return;
    setCategory(saved.category);
    const nextBrand = saved.brands.includes(brand) ? brand : (saved.brands[0] || '');
    setBrand(nextBrand);
    setSelected(nextBrand ? [nextBrand] : []);
    setMode('one');
    setReloadToken((value) => value + 1);
  };

  const onBrand = (next) => {
    setBrand(next);
    setMode('one');
    setReloadToken((value) => value + 1);
  };

  const onMode = (next) => {
    setMode(next);
    if (next === 'selected' && !selected.length && brand) setSelected([brand]);
    setReloadToken((value) => value + 1);
  };

  const toggleSelected = (name) => {
    setSelected((currentSelected) => {
      if (currentSelected.includes(name)) {
        const next = currentSelected.filter((item) => item !== name);
        return next.length ? next : currentSelected;
      }
      return [...currentSelected, name].slice(0, 5);
    });
    setReloadToken((value) => value + 1);
  };

  const focusSelected = (name) => {
    setSelected([name]);
    setBrand(name);
    setMode('one');
    setReloadToken((value) => value + 1);
  };

  const onSelectOneBrand = (name) => {
    setBrand(name);
    setMode('one');
    setReloadToken((value) => value + 1);
  };

  const selectedBrands = mode === 'all'
    ? [brand, ...brands.filter((name) => name !== brand)]
    : mode === 'selected'
      ? [...new Set(
        (selected.includes(brand) ? [brand, ...selected.filter((name) => name !== brand)] : selected)
          .filter((name) => brands.includes(name)),
      )]
      : null;
  const apiBrand = mode === 'one' ? brand : (selectedBrands?.[0] || brand);

  return (
    <BrandDashboard
      key={`${category}:${mode}:${mode === 'one' ? brand : 'multi'}:${reloadToken}:staff`}
      client={client}
      viewer={{
        mode,
        modes: MODES,
        onMode,
        category,
        categoryLabel: current?.label || category,
        brand: apiBrand,
        brands,
        selectedBrands,
        categories,
        onCategory,
        onBrand,
        onSelectOneBrand,
        onToggleSelected: toggleSelected,
        onFocusSelected: focusSelected,
        adminChrome: false,
        staffLinks: true, // top bar: Insights CMS / Metrics / Full eRuchi admin
        dataSource: 'live',
        allowInsights: true,
        fetchMetrics: (metrics) => brandAPI.staffMetrics(category, apiBrand, metrics, {
          skipErrorToast: true,
          skipAuthRedirect: true,
        }),
      }}
    />
  );
}
