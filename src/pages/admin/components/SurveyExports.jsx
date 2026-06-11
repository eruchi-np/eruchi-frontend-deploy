import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";

const SurveyExports = ({ surveys, handleExportTimings }) => {
  if (!surveys || surveys.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Survey Timing Exports
        </h2>
        <p className="text-sm text-gray-500">
          Download comprehensive, per-question raw interaction timing data as CSV formats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {surveys.map((survey) => (
          <div
            key={survey._id}
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-all duration-200 group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {survey.title || "Untitled Survey"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Click icon to export CSV
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleExportTimings(survey._id, survey.title)}
              className="p-2 bg-white border border-gray-200 hover:border-gray-400 rounded-lg text-gray-500 hover:text-gray-900 transition-colors shadow-sm flex-shrink-0 ml-2"
              title="Download CSV Data"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyExports;