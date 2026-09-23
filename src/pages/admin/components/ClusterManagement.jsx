import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Layers,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI, clusterAPI, sepSurveyAPI } from "../../../services/api";

const ClusterManagement = ({ NAVY }) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | detail | sendDetail
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberTotal, setMemberTotal] = useState(0);
  const [sends, setSends] = useState([]);
  const [selectedSend, setSelectedSend] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responsePage, setResponsePage] = useState(1);
  const [responseTotalPages, setResponseTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [targetedSurveys, setTargetedSurveys] = useState([]);
  const [sendSurveyId, setSendSurveyId] = useState("");
  const [sendAt, setSendAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clusterAPI.list({ limit: 100, skipErrorToast: true });
      setClusters(res.data.data || []);
    } catch {
      toast.error("Failed to load clusters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const openCluster = async (cluster) => {
    setSelectedCluster(cluster);
    setEditForm({ name: cluster.name || "", description: cluster.description || "" });
    setView("detail");
    await Promise.all([loadMembers(cluster._id, 1), loadSends(cluster._id)]);
  };

  const loadMembers = async (clusterId, page = 1) => {
    try {
      const res = await clusterAPI.listMembers(clusterId, {
        page,
        limit: 50,
        skipErrorToast: true,
      });
      setMembers(res.data.data || []);
      setMemberPage(res.data.pagination?.currentPage || page);
      setMemberTotalPages(res.data.pagination?.totalPages || 1);
      setMemberTotal(res.data.pagination?.totalMembers || 0);
    } catch {
      toast.error("Failed to load members");
    }
  };

  const loadSends = async (clusterId) => {
    try {
      const res = await clusterAPI.listSends(clusterId, { limit: 50, skipErrorToast: true });
      setSends(res.data.data || []);
    } catch {
      toast.error("Failed to load sends");
    }
  };

  const loadTargetedSurveys = async () => {
    try {
      const res = await sepSurveyAPI.getAvailable({
        manage: "1",
        limit: 200,
        skipErrorToast: true,
      });
      const list = (res.data.data || []).filter(
        (s) => s.visibility === "targeted" && s.status === "published"
      );
      setTargetedSurveys(list);
    } catch {
      toast.error("Failed to load targeted surveys");
    }
  };

  useEffect(() => {
    if (view === "detail") loadTargetedSurveys();
  }, [view]);

  useEffect(() => {
    if (!userSearch.trim() || view !== "detail") {
      setUserResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await adminAPI.getUsers({
          q: userSearch.trim(),
          page: 1,
          limit: 10,
          skipErrorToast: true,
        });
        setUserResults(res.data.data || []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, view]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const res = await clusterAPI.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });
      toast.success("Cluster created");
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      await fetchClusters();
      openCluster(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create cluster");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCluster = async () => {
    if (!selectedCluster) return;
    setBusy(true);
    try {
      const res = await clusterAPI.update(selectedCluster._id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setSelectedCluster(res.data.data);
      toast.success("Cluster updated");
      fetchClusters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCluster = async () => {
    if (!selectedCluster) return;
    if (!window.confirm(`Delete cluster "${selectedCluster.name}"? Members will be removed; past sends are kept.`)) {
      return;
    }
    setBusy(true);
    try {
      await clusterAPI.remove(selectedCluster._id);
      toast.success("Cluster deleted");
      setView("list");
      setSelectedCluster(null);
      fetchClusters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  const handleAddUser = async (userId) => {
    if (!selectedCluster) return;
    try {
      const res = await clusterAPI.addMembers(selectedCluster._id, [userId]);
      const { added, alreadyIn, notFound } = res.data.data || {};
      if (added) toast.success(`Added ${added} member(s)`);
      else if (alreadyIn) toast(`Already in cluster`);
      else if (notFound?.length) toast.error("User not found");
      setSelectedCluster((c) => ({ ...c, memberCount: res.data.data.memberCount }));
      loadMembers(selectedCluster._id, memberPage);
      fetchClusters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedCluster) return;
    try {
      const res = await clusterAPI.removeMembers(selectedCluster._id, [userId]);
      toast.success("Member removed");
      setSelectedCluster((c) => ({ ...c, memberCount: res.data.data.memberCount }));
      loadMembers(selectedCluster._id, memberPage);
      fetchClusters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedCluster) return;
    setBusy(true);
    try {
      const res = await clusterAPI.importMembersCsv(selectedCluster._id, file);
      const d = res.data.data || {};
      toast.success(
        `CSV: added ${d.added || 0}, already ${d.alreadyIn || 0}, not found ${d.notFound?.length || 0}, invalid ${d.invalid?.length || 0}`
      );
      setSelectedCluster((c) => ({ ...c, memberCount: d.memberCount }));
      loadMembers(selectedCluster._id, 1);
      fetchClusters();
    } catch (err) {
      toast.error(err.response?.data?.message || "CSV import failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSendSurvey = async () => {
    if (!selectedCluster || !sendSurveyId) {
      return toast.error("Pick a targeted published survey");
    }
    if (!sendAt) {
      return toast.error("Pick a send date/time");
    }
    const scheduledFor = new Date(sendAt);
    if (Number.isNaN(scheduledFor.getTime())) {
      return toast.error("Invalid send date/time");
    }
    const whenLabel = scheduledFor.toLocaleString();
    if (
      !window.confirm(
        `Send this survey to everyone in the cluster at ${whenLabel}? Membership is snapshotted at that time.`
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await clusterAPI.createSend(
        selectedCluster._id,
        sendSurveyId,
        scheduledFor.toISOString()
      );
      const dueNow = scheduledFor.getTime() <= Date.now();
      toast.success(
        dueNow
          ? "Send queued — assignments are being created"
          : `Send scheduled for ${whenLabel}`
      );
      setSendSurveyId("");
      setSendAt(new Date().toISOString().slice(0, 16));
      await loadSends(selectedCluster._id);
      openSend(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send survey");
    } finally {
      setSending(false);
    }
  };

  const openSend = async (send) => {
    const sendId = send._id || send;
    setView("sendDetail");
    try {
      const res = await clusterAPI.getSend(sendId, { skipErrorToast: true });
      setSelectedSend(res.data.data);
      await loadResponses(sendId, 1);
    } catch {
      toast.error("Failed to load send");
      setView("detail");
    }
  };

  const loadResponses = async (sendId, page = 1) => {
    try {
      const res = await clusterAPI.listSendResponses(sendId, {
        page,
        limit: 50,
        skipErrorToast: true,
      });
      setResponses(res.data.data || []);
      setResponsePage(res.data.pagination?.currentPage || page);
      setResponseTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load responses");
    }
  };

  const refreshSend = async () => {
    if (!selectedSend?._id) return;
    try {
      const res = await clusterAPI.getSend(selectedSend._id, { skipErrorToast: true });
      setSelectedSend(res.data.data);
    } catch {
      /* ignore */
    }
  };

  const handleExportResponses = async () => {
    if (!selectedSend?._id) return;
    try {
      const res = await clusterAPI.exportSendResponsesCsv(selectedSend._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `cluster-send-${selectedSend._id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to export responses");
    }
  };

  if (loading && view === "list") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: NAVY }} />
        Loading clusters...
      </div>
    );
  }

  if (view === "sendDetail" && selectedSend) {
    const survey = selectedSend.surveyId;
    const live = selectedSend.liveStats || {};
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setView("detail");
              setSelectedSend(null);
              if (selectedCluster) loadSends(selectedCluster._id);
            }}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to cluster
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshSend}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportResponses}
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
              ["Emailed", live.emailed ?? 0],
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
                onClick={() => loadResponses(selectedSend._id, responsePage - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={responsePage >= responseTotalPages}
                onClick={() => loadResponses(selectedSend._id, responsePage + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedCluster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setView("list");
              setSelectedCluster(null);
              fetchClusters();
            }}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> All clusters
          </button>
          <button
            type="button"
            onClick={handleDeleteCluster}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>

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
            onClick={handleSaveCluster}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: NAVY }}
          >
            Save changes
          </button>
        </div>

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
              onClick={handleSendSurvey}
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
                    onClick={() => openSend(s)}
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

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Members ({memberTotal})</h3>
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Import CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
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
                      handleAddUser(u._id);
                      setUserSearch("");
                      setUserResults([]);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-50 first:border-0"
                  >
                    <span className="font-medium">
                      {u.firstName} {u.lastName}
                    </span>
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
                          onClick={() => handleRemoveMember(m.userId?._id || m.userId)}
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
                onClick={() => loadMembers(selectedCluster._id, memberPage - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={memberPage >= memberTotalPages}
                onClick={() => loadMembers(selectedCluster._id, memberPage + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
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
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
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
                  onClick={() => openCluster(c)}
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
};

export default ClusterManagement;
