import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI, clusterAPI, sepSurveyAPI } from "../../../services/api";
import ClusterListPanel from "./ClusterListPanel";
import {
  ClusterEditCard,
  ClusterMembersSection,
} from "./ClusterMembersPanel";
import ClusterSendsPanel from "./ClusterSendsPanel";

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
          includeAdmins: "1",
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
    return (
      <ClusterSendsPanel
        mode="sendDetail"
        NAVY={NAVY}
        selectedSend={selectedSend}
        responses={responses}
        responsePage={responsePage}
        responseTotalPages={responseTotalPages}
        onBack={() => {
          setView("detail");
          setSelectedSend(null);
          if (selectedCluster) loadSends(selectedCluster._id);
        }}
        onRefresh={refreshSend}
        onExport={handleExportResponses}
        onLoadResponses={loadResponses}
      />
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

        <ClusterEditCard
          NAVY={NAVY}
          selectedCluster={selectedCluster}
          memberTotal={memberTotal}
          editForm={editForm}
          setEditForm={setEditForm}
          busy={busy}
          onSave={handleSaveCluster}
        />

        <ClusterSendsPanel
          mode="schedule"
          NAVY={NAVY}
          targetedSurveys={targetedSurveys}
          sendSurveyId={sendSurveyId}
          setSendSurveyId={setSendSurveyId}
          sendAt={sendAt}
          setSendAt={setSendAt}
          sending={sending}
          sends={sends}
          onSendSurvey={handleSendSurvey}
          onOpenSend={openSend}
        />

        <ClusterMembersSection
          memberTotal={memberTotal}
          members={members}
          memberPage={memberPage}
          memberTotalPages={memberTotalPages}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userResults={userResults}
          searchingUsers={searchingUsers}
          selectedClusterId={selectedCluster._id}
          onCsvUpload={handleCsvUpload}
          onAddUser={handleAddUser}
          onClearUserSearch={() => {
            setUserSearch("");
            setUserResults([]);
          }}
          onRemoveMember={handleRemoveMember}
          onLoadMembers={loadMembers}
        />
      </div>
    );
  }

  return (
    <ClusterListPanel
      NAVY={NAVY}
      clusters={clusters}
      showCreate={showCreate}
      setShowCreate={setShowCreate}
      createForm={createForm}
      setCreateForm={setCreateForm}
      busy={busy}
      onCreate={handleCreate}
      onOpenCluster={openCluster}
    />
  );
};

export default ClusterManagement;
