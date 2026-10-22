import React from "react";
import { getMaxWards } from "../../../utils/municipalityData";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  Download,
  X,
} from "lucide-react";
import {
  ACTIVITY_OPTIONS,
  BOOL_OPTIONS,
  EMAIL_EXPORT_TYPES,
  LIFECYCLE_OPTIONS,
} from "./userManagementFilters";

const BoolSelect = ({ label, field, advancedDraft, setDraft }) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    <select
      value={advancedDraft[field]}
      onChange={(e) => setDraft(field, e.target.value)}
      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
    >
      {BOOL_OPTIONS.map((opt) => (
        <option key={opt.value || "any"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

const DateRange = ({ label, fromKey, toKey, advancedDraft, setDraft }) => (
  <div>
    <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
    <div className="grid grid-cols-2 gap-2">
      <input
        type="date"
        value={advancedDraft[fromKey]}
        onChange={(e) => setDraft(fromKey, e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        aria-label={`${label} from`}
      />
      <input
        type="date"
        value={advancedDraft[toKey]}
        onChange={(e) => setDraft(toKey, e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        aria-label={`${label} to`}
      />
    </div>
  </div>
);

const UserFiltersPanel = ({
  NAVY,
  totalUsers,
  hasAnyFilter,
  searchTerm,
  setSearchTerm,
  selectedLabel,
  filterDropdownOpen,
  setFilterDropdownOpen,
  activityFilter,
  handleActivityFilter,
  advancedOpen,
  setAdvancedOpen,
  advancedCount,
  advancedDraft,
  setDraft,
  addressQuery,
  setAddressQuery,
  addressMenuOpen,
  setAddressMenuOpen,
  addressMunicipality,
  setAddressMunicipality,
  addressWard,
  setAddressWard,
  filteredMunicipalities,
  addAddress,
  removeAddress,
  applyAdvanced,
  clearAdvanced,
  exporting,
  exportModalOpen,
  setExportModalOpen,
  exportType,
  setExportType,
  handleExport,
}) => (
  <>
    <div className="border-b border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
          <p className="text-sm text-gray-500">
            {hasAnyFilter
              ? `${totalUsers.toLocaleString()} user${totalUsers === 1 ? "" : "s"} match filters`
              : "View and manage all user accounts"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, username, or id"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent w-full sm:w-64"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilterDropdownOpen(!filterDropdownOpen);
              }}
              className="flex items-center gap-2 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none w-full sm:w-auto hover:bg-gray-100 transition-colors"
            >
              <Filter className="absolute left-3 h-5 w-5 text-gray-400" />
              <span className="flex-1 text-left">{selectedLabel}</span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value || "all"}
                      type="button"
                      onClick={() => handleActivityFilter(opt.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${activityFilter === opt.value ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: activityFilter === opt.value ? `${NAVY}20` : "#f3f4f6",
                        }}
                      >
                        <opt.icon
                          className="h-4 w-4"
                          style={{ color: activityFilter === opt.value ? NAVY : "#6b7280" }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.sub}</p>
                      </div>
                      {activityFilter === opt.value && (
                        <Check className="h-4 w-4" style={{ color: NAVY }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-500" />
            More filters
            {advancedCount > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs text-white"
                style={{ backgroundColor: NAVY }}
              >
                {advancedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            disabled={exporting || totalUsers === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
            title="Export emails for a chosen email category"
          >
            <Download className="h-4 w-4" />
            Export emails
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Lifecycle</span>
              <select
                value={advancedDraft.lifecycleState}
                onChange={(e) => setDraft("lifecycleState", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {LIFECYCLE_OPTIONS.map((opt) => (
                  <option key={opt.value || "any"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <BoolSelect label="Verified" field="isVerified" advancedDraft={advancedDraft} setDraft={setDraft} />
            <BoolSelect label="Profile complete" field="isProfileComplete" advancedDraft={advancedDraft} setDraft={setDraft} />
            <BoolSelect label="Additional profile complete" field="isAdditionalProfileComplete" advancedDraft={advancedDraft} setDraft={setDraft} />
            <BoolSelect label="Unsubscribed from emails" field="unsubscribedFromEmails" advancedDraft={advancedDraft} setDraft={setDraft} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Credits min</span>
              <input
                type="number"
                value={advancedDraft.creditsMin}
                onChange={(e) => setDraft("creditsMin", e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Credits max</span>
              <input
                type="number"
                value={advancedDraft.creditsMax}
                onChange={(e) => setDraft("creditsMax", e.target.value)}
                placeholder="Any"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Address</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={addressMenuOpen ? addressQuery : addressMunicipality}
                  onChange={(event) => {
                    setAddressQuery(event.target.value);
                    setAddressMenuOpen(true);
                  }}
                  onFocus={() => {
                    setAddressQuery("");
                    setAddressMenuOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setAddressMenuOpen(false), 150);
                  }}
                  placeholder="Search municipality"
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                {addressMenuOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {Object.keys(filteredMunicipalities).length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-500">
                        {addressQuery.trim() ? "No municipalities found" : "Type to search municipalities"}
                      </p>
                    ) : (
                      Object.entries(filteredMunicipalities).map(([type, municipalities]) => (
                        <div key={type}>
                          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
                            {type}
                          </p>
                          {municipalities.map((municipality) => (
                            <button
                              key={`${type}-${municipality.name}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setAddressMunicipality(municipality.name);
                                setAddressQuery("");
                                setAddressMenuOpen(false);
                                setAddressWard("");
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              {municipality.name}
                              <span className="ml-2 text-xs text-gray-500">{municipality.wards} wards</span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <select
                value={addressWard}
                onChange={(event) => setAddressWard(event.target.value)}
                disabled={!addressMunicipality}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                aria-label="Ward"
              >
                <option value="">Ward</option>
                {addressMunicipality ? <option value="*">All wards</option> : null}
                {addressMunicipality
                  ? Array.from({ length: getMaxWards(addressMunicipality) }, (_, index) => index + 1).map((ward) => (
                      <option key={ward} value={String(ward)}>
                        Ward {ward}
                      </option>
                    ))
                  : null}
              </select>
              <button
                type="button"
                onClick={addAddress}
                disabled={!addressMunicipality || !addressWard}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-900 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {(advancedDraft.addresses || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {advancedDraft.addresses.map((item) => (
                  <button
                    key={`${item.municipality}|${item.ward ?? "*"}`}
                    type="button"
                    onClick={() => removeAddress(item.municipality, item.ward)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100"
                  >
                    {item.ward == null ? `${item.municipality} · All wards` : `${item.municipality} · Ward ${item.ward}`}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DateRange label="Created at (Nepal)" fromKey="createdAtFrom" toKey="createdAtTo" advancedDraft={advancedDraft} setDraft={setDraft} />
            <DateRange
              label="Date of birth (Nepal)"
              fromKey="dateOfBirthFrom"
              toKey="dateOfBirthTo"
              advancedDraft={advancedDraft}
              setDraft={setDraft}
            />
            <DateRange
              label="Last survey completed (Nepal)"
              fromKey="lastSurveyCompletedAtFrom"
              toKey="lastSurveyCompletedAtTo"
              advancedDraft={advancedDraft}
              setDraft={setDraft}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyAdvanced}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearAdvanced}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
            <p className="text-xs text-gray-500 sm:ml-2">
              Export asks which email type you are sending, then includes only opted-in users.
            </p>
          </div>
        </div>
      )}
    </div>

    {exportModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Export emails for</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose the type of email you will send. Only users opted into that category are included.
            CSV includes an unsubscribe URL per row for mail merge.
          </p>
          <div className="space-y-2 mb-6">
            {EMAIL_EXPORT_TYPES.map((opt) => (
              <label
                key={opt.value}
                className={`flex gap-3 items-start p-3 rounded-xl border cursor-pointer ${
                  exportType === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  className="mt-1"
                  checked={exportType === opt.value}
                  onChange={() => setExportType(opt.value)}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                  <span className="block text-xs text-gray-500">{opt.sub}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
              disabled={exporting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {exporting ? "Exporting…" : "Download CSV"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);

export default UserFiltersPanel;
