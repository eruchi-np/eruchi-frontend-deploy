import React from "react";
import SurveyDetailBody from "./SurveyDetailBody.jsx";

const SurveyManagement = ({ surveys, refetchSurveys, NAVY }) => {
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
        {surveys.map((survey) => (
          <div key={survey._id} className="px-4 sm:px-6 py-4">
            <SurveyDetailBody survey={survey} refetchSurveys={refetchSurveys} NAVY={NAVY} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyManagement;
