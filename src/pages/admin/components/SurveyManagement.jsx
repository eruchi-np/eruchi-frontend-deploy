import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sepSurveyAPI } from "../../../services/api";
import { Pencil, Trash2, Clock, Award, User, Ticket, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

const EDIT_WINDOW_MINUTES = 15;

const isEditable = (createdAt) => {
  if (!createdAt) return false;
  const minutesSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
  return minutesSinceCreation <= EDIT_WINDOW_MINUTES;
};

const isScheduled = (startDate) => {
  if (!startDate) return false;
  return new Date(startDate) > new Date();
};

const formatCreatedAt = (createdAt) => {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const SurveyManagement = ({ surveys, refetchSurveys, NAVY }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (surveyId, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(surveyId);
    try {
      await sepSurveyAPI.delete(surveyId);
      toast.success("Survey deleted");
      refetchSurveys();
    } catch (err) {
      console.error("Failed to delete survey", err);
      toast.error(err.response?.data?.message || "Failed to delete survey");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (surveyId) => {
    navigate(`/admin/edit-sep-survey/${surveyId}`);
  };

  if (!surveys.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No surveys yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Surveys</h2>
        <p className="text-sm text-gray-500">{surveys.length} total</p>
      </div>

      <div className="divide-y divide-gray-100">
        {surveys.map((survey) => {
          const editable = isEditable(survey.createdAt);
          return (
            <div key={survey._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">{survey.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {survey.status}
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(survey._id)}
                  disabled={!editable}
                  title={editable ? "Edit" : "Edit window (15 min) has passed"}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={editable ? { borderColor: NAVY, color: NAVY } : { borderColor: "#e5e7eb", color: "#9ca3af" }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(survey._id, survey.title)}
                  disabled={deletingId === survey._id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SurveyManagement;