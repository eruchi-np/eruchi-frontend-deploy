import React from "react";
import useUserListQuery from "./useUserListQuery";
import UserFiltersPanel from "./UserFiltersPanel";
import UserTable, { UserPagination } from "./UserTable";

const UserManagement = ({
  users,
  fetchUsers,
  exportUserEmails,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  handlePageChange,
  NAVY,
  onSelectUser,
}) => {
  const q = useUserListQuery({ fetchUsers, exportUserEmails, handlePageChange });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <UserFiltersPanel
          NAVY={NAVY}
          totalUsers={totalUsers}
          hasAnyFilter={q.hasAnyFilter}
          searchTerm={q.searchTerm}
          setSearchTerm={q.setSearchTerm}
          selectedLabel={q.selectedLabel}
          filterDropdownOpen={q.filterDropdownOpen}
          setFilterDropdownOpen={q.setFilterDropdownOpen}
          activityFilter={q.activityFilter}
          handleActivityFilter={q.handleActivityFilter}
          advancedOpen={q.advancedOpen}
          setAdvancedOpen={q.setAdvancedOpen}
          advancedCount={q.advancedCount}
          advancedDraft={q.advancedDraft}
          setDraft={q.setDraft}
          addressQuery={q.addressQuery}
          setAddressQuery={q.setAddressQuery}
          addressMenuOpen={q.addressMenuOpen}
          setAddressMenuOpen={q.setAddressMenuOpen}
          addressMunicipality={q.addressMunicipality}
          setAddressMunicipality={q.setAddressMunicipality}
          addressWard={q.addressWard}
          setAddressWard={q.setAddressWard}
          filteredMunicipalities={q.filteredMunicipalities}
          addAddress={q.addAddress}
          removeAddress={q.removeAddress}
          applyAdvanced={q.applyAdvanced}
          clearAdvanced={q.clearAdvanced}
          exporting={q.exporting}
          exportModalOpen={q.exportModalOpen}
          setExportModalOpen={q.setExportModalOpen}
          exportType={q.exportType}
          setExportType={q.setExportType}
          handleExport={q.handleExport}
        />

        <UserTable
          users={users}
          listLoading={q.listLoading}
          NAVY={NAVY}
          onSelectUser={onSelectUser}
        />
      </div>

      <UserPagination
        NAVY={NAVY}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={totalUsers}
        pageSize={pageSize}
        goToPage={q.goToPage}
      />
    </>
  );
};

export default UserManagement;
