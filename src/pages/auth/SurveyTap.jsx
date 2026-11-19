import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Short frontend entry for one-tap links (/s/:code).
 * Full-page navigates to the API redeem endpoint so the auth cookie is set, then redirected.
 */
export default function SurveyTap() {
  const { code } = useParams();

  useEffect(() => {
    const safe = String(code || '').trim();
    if (!safe) return;
    const qs = typeof window !== 'undefined' ? window.location.search || '' : '';
    window.location.replace(`${API_BASE}/auth/survey-tap/${encodeURIComponent(safe)}${qs}`);
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-label="Opening survey" />
    </div>
  );
}
