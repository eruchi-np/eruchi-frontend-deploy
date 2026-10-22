import React from "react";
import { ArrowLeft, Download, Loader2, Send } from "lucide-react";

/** Schedule a send + past sends list (detail view). */
export const ClusterSendSchedule = ({
  NAVY,
  targetedSurveys,
  sendSurveyId,
  setSendSurveyId,
  sendAt,
  setSendAt,
  sending,
  sends,
  onSendSurvey,
  onOpenSend,
}) => (
  <>
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Send className="h-4 w-4" /> Send targeted survey
      </h3>
      <p className="text-sm text-gray-500">
        Only published surveys with visibility &quot;targeted&quot; can be sent. Membership is snapshotted at the send time you choose.
      </p>
      <div className="flex flex-col gap-3">
        <select
          value={sendSurveyId}
          onChange={(e) => setSendSurveyId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="">Select survey…</option>
          {targetedSurveys.map((s) => (
            <option key={s._id} value={s._id}>
              {s.title}
            </option>
          ))}
        </select>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Send on</label>
          <input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full sm:max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onSendSurvey}
          disabled={sending || !sendSurveyId || !sendAt}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 sm:self-start"
          style={{ backgroundColor: NAVY }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to cluster
        </button>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Past sends</span>
      </div>
      {sends.length === 0 ? (
        <p className="px-6 py-8 text-sm text-gray-400 text-center">No sends yet</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sends.map((s) => (
            <li key={s._id}>
              <button
                type="button"
                onClick={() => onOpenSend(s)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 flex justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {s.surveyId?.title || "Survey"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.scheduledFor || s.createdAt).toLocaleString()}
                    {s.scheduledFor &&
                    new Date(s.scheduledFor).getTime() > Date.now() &&
                    s.status === "queued"
                      ? " (scheduled)"
                      : ""}{" "}
                    · {s.memberCount} members · {s.status}
                  </div>
                </div>
                <span className="text-sm text-gray-400">View →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </>
);

/** Send detail: stats, responses table, export. */
export const ClusterSendDetail = ({
  NAVY,
  selectedSend,
  responses,
  responsePage,
  responseTotalPages,
  onBack,
  onRefresh,
  onExport,
  onLoadResponses,
}) => {
  const survey = selectedSend.surveyId;
  const live = selectedSend.liveStats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cluster
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: NAVY }}
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {survey?.title || "Survey send"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Status: <span className="font-medium text-gray-800">{selectedSend.status}</span>
          {" · "}
          Send time:{" "}
          {new Date(selectedSend.scheduledFor || selectedSend.createdAt).toLocaleString()}
          {" · "}
          Snapshot size: {selectedSend.memberCount}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Pending", live.pending ?? 0],
            ["Completed", live.completed ?? 0],
            ["Skipped", live.skipped ?? 0],
            ["Eligible", live.emailed ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
            </div>
          ))}
        </div>
        {selectedSend.error && (
          <p className="mt-4 text-sm text-red-600">{selectedSend.error}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
          Responses
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {responses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                    No responses yet
                  </td>
                </tr>
              ) : (
                responses.map((r) => (
                  <tr key={r._id} className="border-t border-gray-100">
                    <td className="px-6 py-3">
                      {r.user?.firstName} {r.user?.lastName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{r.user?.email}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {responseTotalPages > 1 && (
          <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100">
            <button
              type="button"
              disabled={responsePage <= 1}
              onClick={() => onLoadResponses(selectedSend._id, responsePage - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={responsePage >= responseTotalPages}
              onClick={() => onLoadResponses(selectedSend._id, responsePage + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ClusterSendsPanel = ({ mode = "schedule", ...props }) => {
  if (mode === "sendDetail") {
    return <ClusterSendDetail {...props} />;
  }
  return <ClusterSendSchedule {...props} />;
};

export default ClusterSendsPanel;
