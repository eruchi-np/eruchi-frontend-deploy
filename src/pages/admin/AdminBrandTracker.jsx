import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAPI, brandAPI } from '../../services/api';
import BrandDashboard from '../brand/BrandDashboard';

export default function AdminBrandTracker() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('FB');
  const [brand, setBrand] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    brandAPI.catalog({ skipErrorToast: true })
      .then(({ data }) => {
        const list = data.categories || [];
        setCategories(list);
        const first = list.find((item) => item.category === 'FB') || list[0];
        if (first) {
          setCategory(first.category);
          setBrand(first.brands[0] || '');
        }
      })
      .catch(() => setError('Could not load the brand list.'));
  }, []);

  const current = categories.find((item) => item.category === category);

  const onCategory = (next) => {
    const found = categories.find((item) => item.category === next);
    setCategory(next);
    setBrand(found?.brands?.[0] || '');
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

  return (
    <BrandDashboard
      key={`${category}:${brand}`}
      viewer={{
        category,
        categoryLabel: current.label,
        brand,
        brands: current.brands,
        categories,
        onCategory,
        onBrand: setBrand,
        fetchMetrics: (metrics) => adminAPI.getBrandMetrics(category, brand, metrics, { skipErrorToast: true }),
      }}
    />
  );
}
