import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Award, BarChart3, Clock, EyeOff, Pencil, Ticket, Trash2, User, Upload, X } from "lucide-react";
import { sepSurveyAPI } from "../../../services/api";
import toast from "react-hot-toast";
import { formatCreatedAt, isEditable, isScheduled } from "./surveyListUtils";

export default function SurveyDetailBody({ survey, NAVY, refetchSurveys, onDeleted }) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [status, setStatus] = useState(survey.status);
  const editable = isEditable(survey.createdAt);

  useEffect(() => {
    setStatus(survey.status);
  }, [survey.status]);

  const handleStatus = async (nextStatus) => {
    setStatusSaving(true);
    try {
      await sepSurveyAPI.updateStatus(survey._id, nextStatus, { skipErrorToast: true });
      toast.success(nextStatus === "published" ? "Survey published" : "Survey unpublished");
      setStatus(nextStatus);
      refetchSurveys?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${survey.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(survey._id);
    try {
      await sepSurveyAPI.delete(survey._id, { skipErrorToast: true });
      toast.success("Survey deleted");
      refetchSurveys?.();
      onDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete survey");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900">{survey.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {status}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {survey.visibility === "targeted" ? "Targeted" : "Public"}
          </span>
          {isScheduled(survey.startDate) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Scheduled
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {survey.credits} credits</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {formatCreatedAt(survey.createdAt)}</span>
          {survey.createdByName && (
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {survey.createdByName}</span>
          )}
          {typeof survey.responseCount === "number" && (
            <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {survey.responseCount} response{survey.responseCount !== 1 ? "s" : ""}</span>
          )}
          {survey.linkedVoucherTitles?.length > 0 && (
            <span className="flex items-center gap-1"><Ticket className="h-3.5 w-3.5" /> {survey.linkedVoucherTitles.join(", ")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {status === "published" ? (
          <button
            type="button"
            onClick={() => handleStatus("archived")}
            disabled={statusSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <EyeOff className="h-3.5 w-3.5" /> Unpublish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStatus("published")}
            disabled={statusSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            <Upload className="h-3.5 w-3.5" /> Publish
          </button>
        )}
        <button
          onClick={() => navigate(`/admin/edit-sep-survey/${survey._id}`)}
          disabled={!editable}
          title={editable ? "Edit" : "Edit window (15 min) has passed"}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={editable ? { borderColor: NAVY, color: NAVY } : { borderColor: "#e5e7eb", color: "#9ca3af" }}
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deletingId === survey._id}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

export function SurveyDetailModal({ survey, NAVY, refetchSurveys, onClose }) {
  useEffect(() => {
    if (!survey) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [survey, onClose]);

  if (!survey) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Survey details</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <SurveyDetailBody
          survey={survey}
          NAVY={NAVY}
          refetchSurveys={refetchSurveys}
          onDeleted={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
