import React, { useCallback, useEffect, useState } from "react";
import { adminAPI } from "../../../services/api";
import { Loader2, BarChart3, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const MetricInsights = ({ NAVY }) => {
  const [loading, setLoading] = useState(true);
  const [nps, setNps] = useState(null);
  const [cep, setCep] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [npsRes, cepRes] = await Promise.all([
        adminAPI.getNpsMetrics({ skipErrorToast: true }),
        adminAPI.getCepMetrics({ skipErrorToast: true }),
      ]);
      setNps(npsRes.data?.data || null);
      setCep(cepRes.data?.data || null);
    } catch {
      toast.error("Failed to load CEP / NPS metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: NAVY }} />
        Loading metrics…
      </div>
    );
  }

  const maxDist = Math.max(1, ...(nps?.distribution || []).map((d) => d.count));
  const maxCep = Math.max(1, ...(cep?.optionCounts || []).slice(0, 12).map((o) => o.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: NAVY }} />
            CEP &amp; NPS insights
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            From tagged survey answers in CepResponse / NpsResponse collections.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: NAVY }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">NPS score</p>
          <p className="text-4xl font-bold mt-2" style={{ color: NAVY }}>
            {nps?.nps == null ? "—" : nps.nps}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            % Promoters − % Detractors · {nps?.scoredResponses || 0} scored responses
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Promoters / Passives / Detractors</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {nps?.promoters || 0} / {nps?.passives || 0} / {nps?.detractors || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {nps?.promoterPct || 0}% · {nps?.passivePct || 0}% · {nps?.detractorPct || 0}%
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tagged questions</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            NPS {nps?.questionCount || 0} · CEP {cep?.questionCount || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            CEP answers: {cep?.totalResponses || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">NPS distribution (0–10)</h3>
          {(nps?.distribution || []).every((d) => d.count === 0) ? (
            <p className="text-sm text-gray-400">No NPS responses yet.</p>
          ) : (
            <div className="space-y-2">
              {(nps?.distribution || []).map((d) => (
                <div key={d.score} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-gray-600 font-medium">{d.score}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.count / maxDist) * 100}%`,
                        backgroundColor: d.score >= 9 ? "#16a34a" : d.score >= 7 ? "#ca8a04" : "#dc2626",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">CEP attribute mentions</h3>
          {(cep?.optionCounts || []).length === 0 ? (
            <p className="text-sm text-gray-400">No CEP responses yet.</p>
          ) : (
            <div className="space-y-2">
              {(cep.optionCounts || []).slice(0, 12).map((o) => (
                <div key={o.option} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate text-gray-700" title={o.option}>{o.option}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(o.count / maxCep) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500">{o.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricInsights;
