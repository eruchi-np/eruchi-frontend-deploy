import React from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Users } from "lucide-react";
import Pagination from "../../../components/ui/Pagination";

const statusClass = (status) => {
  switch (status) {
    case "available":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "completed":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "archived":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const CampaignManagement = ({
  campaigns,
  loading,
  pagination,
  onPageChange,
  NAVY,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Campaigns</h2>
        <p className="text-sm text-gray-500">
          {pagination?.totalCampaigns ?? campaigns.length} total — edit status, dates, and survey
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: NAVY }} />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No campaigns yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {campaign.activeJoinCount || 0} currently joined
                  </span>
                  {campaign.endDate && <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>}
                  {campaign.survey && (
                    <span>
                      {campaign.survey.questionCount} questions · {campaign.survey.creditsToAward} credits
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/edit-campaign/${campaign._id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border shrink-0"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pb-4">
        <Pagination
          page={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          total={pagination?.totalCampaigns}
          pageSize={50}
          onChange={onPageChange}
          label="campaigns"
        />
      </div>
    </div>
  );
};

export default CampaignManagement;
