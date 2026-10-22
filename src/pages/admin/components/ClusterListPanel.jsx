import React from "react";
import { Layers, Plus, X } from "lucide-react";

const ClusterListPanel = ({
  NAVY,
  clusters,
  showCreate,
  setShowCreate,
  createForm,
  setCreateForm,
  busy,
  onCreate,
  onOpenCluster,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: NAVY }} /> User clusters
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Group users, then send targeted surveys to the whole group.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor: NAVY }}
      >
        <Plus className="h-4 w-4" /> New cluster
      </button>
    </div>

    {showCreate && (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 relative">
        <button
          type="button"
          onClick={() => setShowCreate(false)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <form onSubmit={onCreate} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: NAVY }}
          >
            Create
          </button>
        </form>
      </div>
    )}

    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {clusters.length === 0 ? (
        <p className="px-6 py-12 text-center text-gray-400 text-sm">
          No clusters yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {clusters.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => onOpenCluster(c)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 flex justify-between gap-3 items-center"
              >
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  {c.description ? (
                    <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.description}</div>
                  ) : null}
                  <div className="text-xs text-gray-400 mt-1">
                    {c.memberCount || 0} members
                    {c.createdBy?.firstName ? ` · by ${c.createdBy.firstName}` : ""}
                  </div>
                </div>
                <span className="text-sm text-gray-400 shrink-0">Open →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default ClusterListPanel;
