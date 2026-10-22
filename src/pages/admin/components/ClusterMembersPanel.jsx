import React from "react";
import { Upload, Users } from "lucide-react";

/** Edit cluster name/description card (detail view). */
export const ClusterEditCard = ({
  NAVY,
  selectedCluster,
  memberTotal,
  editForm,
  setEditForm,
  busy,
  onSave,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <Users className="h-4 w-4" /> {selectedCluster.memberCount ?? memberTotal} members
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
      <input
        value={editForm.name}
        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
      <textarea
        value={editForm.description}
        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
        rows={2}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
      />
    </div>
    <button
      type="button"
      onClick={onSave}
      disabled={busy}
      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
      style={{ backgroundColor: NAVY }}
    >
      Save changes
    </button>
  </div>
);

/** Members search / add / CSV / table (detail view). */
export const ClusterMembersSection = ({
  memberTotal,
  members,
  memberPage,
  memberTotalPages,
  userSearch,
  setUserSearch,
  userResults,
  searchingUsers,
  selectedClusterId,
  onCsvUpload,
  onAddUser,
  onClearUserSearch,
  onRemoveMember,
  onLoadMembers,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h3 className="font-semibold text-gray-900">Members ({memberTotal})</h3>
      <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 cursor-pointer hover:bg-gray-50">
        <Upload className="h-4 w-4" />
        Import CSV
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvUpload} />
      </label>
    </div>
    <p className="text-xs text-gray-500">
      CSV columns: email or user id (headers like email / userId). Unknown emails are skipped — users are never auto-created.
    </p>
    <div className="relative">
      <input
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        placeholder="Search users to add…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
      />
      {(searchingUsers || userResults.length > 0) && userSearch.trim() && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {searchingUsers && (
            <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
          )}
          {userResults.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => {
                onAddUser(u._id);
                onClearUserSearch();
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-50 first:border-0"
            >
              <span className="font-medium">
                {u.firstName} {u.lastName}
              </span>
              {u.role && u.role !== "user" && (
                <span className="ml-2 text-xs font-medium text-gray-500">
                  {u.role === "business_admin"
                    ? "Business admin"
                    : u.role === "customer_admin"
                      ? "Customer admin"
                      : "Admin"}
                </span>
              )}
              <span className="text-gray-500 ml-2">{u.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="overflow-x-auto border border-gray-100 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium w-24" />
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                No members yet
              </td>
            </tr>
          ) : (
            members.map((m) => (
              <tr key={m._id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  {m.userId?.firstName} {m.userId?.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{m.userId?.email}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveMember(m.userId?._id || m.userId)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {memberTotalPages > 1 && (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={memberPage <= 1}
          onClick={() => onLoadMembers(selectedClusterId, memberPage - 1)}
          className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={memberPage >= memberTotalPages}
          onClick={() => onLoadMembers(selectedClusterId, memberPage + 1)}
          className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
        >
          Next
        </button>
      </div>
    )}
  </div>
);

/**
 * Default export: both edit + members (order preserved when used alone).
 * Detail view interleaves sends between them via named exports.
 */
const ClusterMembersPanel = (props) => (
  <>
    <ClusterEditCard {...props} />
    <ClusterMembersSection {...props} />
  </>
);

export default ClusterMembersPanel;
