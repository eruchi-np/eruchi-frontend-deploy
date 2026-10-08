// Platform health page. Loads the counts, switches the six tabs, and opens a user when an id is clicked.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import UserDetailDrawer from '../components/UserDetailDrawer.jsx';
import { BackToTop } from './HealthChartKit.jsx';
import { Activation } from './HealthActivation.jsx';
import { Surveys } from './HealthSurveys.jsx';
import { Rewards } from './HealthRewards.jsx';
import { Retention } from './HealthRetention.jsx';
import { Channel } from './HealthChannel.jsx';
import { Trust } from './HealthTrust.jsx';
import {
  Legend,
  NAVY,
  OpenUserContext,
  SECTIONS,
  when,
} from './healthUi.jsx';

export default function AdminHealth() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState('activation');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let hasData = false;
    const load = () => {
      adminAPI.getHealth({ skipErrorToast: true })
        .then((response) => {
          if (cancelled) return;
          if (response.data.data) {
            setData(response.data.data);
            setError('');
            hasData = true;
            return;
          }
          timer = setTimeout(load, 5000);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err.response?.status === 401 || err.response?.status === 403) {
            navigate('/admin');
            return;
          }
          if (!hasData) setError('The health counts could not be loaded.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <OpenUserContext.Provider value={setSelectedUserId}>
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Back to admin">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Platform health</h1>
              <p className="text-sm text-gray-500">
                Separate from the operations dashboard.
                {data ? ` Counted ${when(data.computedAt)}. Counts refresh about every 5 minutes.` : ''}
                {!loading && !data && !error ? ' The first count is still running.' : ''}
              </p>
              <div className="mt-2"><Legend /></div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {SECTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className="px-4 py-2 rounded-xl text-sm font-medium shrink-0"
                style={section === id ? { backgroundColor: NAVY, color: 'white' } : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : null}
        {!loading && !data && !error ? (
          <p className="text-sm text-gray-500">The first count is still running.</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {data?.blocked ? (
          <p className="mb-4 rounded-xl bg-red-50 text-red-800 text-sm px-4 py-3">A credit ledger does not match the stored balance. Counts stay blocked until that is fixed. Balances were not changed.</p>
        ) : null}
        {data && section === 'activation' ? <Activation data={data} /> : null}
        {data && section === 'surveys' ? <Surveys data={data} /> : null}
        {data && section === 'rewards' ? <Rewards data={data} /> : null}
        {data && section === 'retention' ? <Retention data={data} /> : null}
        {data && section === 'channel' ? <Channel data={data} /> : null}
        {data && section === 'trust' ? <Trust data={data} /> : null}
      </div>
      {selectedUserId ? (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          NAVY={NAVY}
        />
      ) : null}
      <BackToTop />
    </div>
    </OpenUserContext.Provider>
  );
}

