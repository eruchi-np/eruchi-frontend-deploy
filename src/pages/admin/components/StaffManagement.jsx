import React, { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../../services/api";
import { roleLabel } from "../../../utils/adminRoles";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "business_admin", label: "Business admin" },
  { value: "customer_admin", label: "Customer admin" },
];

const editableRoleValue = (role) => (role === "superadmin" ? "admin" : role);

const StaffManagement = ({ NAVY, currentUserId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [draftRoles, setDraftRoles] = useState({});
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteRole, setPromoteRole] = useState("customer_admin");
  const [promoting, setPromoting] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStaff({ skipErrorToast: true });
      const rows = res.data.data || [];
      setStaff(rows);
      const drafts = {};
      rows.forEach((row) => {
        drafts[row.id] = editableRoleValue(row.role);
      });
      setDraftRoles(drafts);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const saveRole = async (userId) => {
    const role = draftRoles[userId];
    if (!role) return;
    setSavingId(userId);
    try {
      await adminAPI.updateStaffRole(userId, { role });
      toast.success("Role updated");
      await loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const demote = async (userId) => {
    if (!window.confirm("Remove staff access and set this account to normal user?")) return;
    setSavingId(userId);
    try {
      await adminAPI.updateStaffRole(userId, { role: "user" });
      toast.success("Staff access removed");
      await loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove staff access");
    } finally {
      setSavingId(null);
    }
  };

  const promote = async (e) => {
    e.preventDefault();
    if (!promoteEmail.trim()) {
      toast.error("Enter an email");
      return;
    }
    setPromoting(true);
    try {
      await adminAPI.promoteStaff({ email: promoteEmail.trim(), role: promoteRole });
      toast.success("Staff role assigned");
      setPromoteEmail("");
      await loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to promote user");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${NAVY}14` }}>
            <Shield className="h-5 w-5" style={{ color: NAVY }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Promote user</h2>
            <p className="text-sm text-gray-500">
              Find an existing account by email and assign a staff role.
            </p>
          </div>
        </div>
        <form onSubmit={promote} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            placeholder="user@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <select
            value={promoteRole}
            onChange={(e) => setPromoteRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={promoting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: NAVY }}
          >
            {promoting ? "Saving…" : "Assign role"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Staff accounts</h2>
          <p className="text-sm text-gray-500">
            {staff.length} staff · only full admins can manage these roles
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: NAVY }}
            />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No staff accounts found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((row) => {
              const locked = row.canEditRole === false;
              const draft = draftRoles[row.id] || editableRoleValue(row.role);
              const dirty = draft !== editableRoleValue(row.role);
              return (
                <div key={row.id} className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.firstName} {row.lastName}
                      {String(row.id) === String(currentUserId) ? (
                        <span className="ml-2 text-xs font-medium text-gray-400">(you)</span>
                      ) : null}
                      {row.protected ? (
                        <span className="ml-2 text-xs font-medium text-amber-600">Protected</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{row.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Current: {roleLabel(row.role)}
                      {row.lastActiveAt
                        ? ` · Last active ${new Date(row.lastActiveAt).toLocaleString()}`
                        : ""}
                      {locked ? " · Role locked" : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={draft}
                      disabled={locked || savingId === row.id}
                      onChange={(e) =>
                        setDraftRoles((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={locked || !dirty || savingId === row.id}
                      onClick={() => saveRole(row.id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: NAVY }}
                    >
                      {savingId === row.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={locked || savingId === row.id}
                      onClick={() => demote(row.id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Remove staff
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
