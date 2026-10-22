import React from "react";
import { Users, Mail, Award, Clock } from "lucide-react";
import { formatLastOnline } from "./userManagementFilters";

export const UserPagination = ({
  NAVY,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  goToPage,
}) => {
  if (!(totalPages > 1 || totalUsers > 0)) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-gray-600">
          {totalUsers === 0 ? (
            <>0 users</>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, totalUsers)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{totalUsers}</span> users
            </>
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              style={currentPage === 1 ? {} : { backgroundColor: NAVY }}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum =
                  totalPages <= 5
                    ? idx + 1
                    : currentPage <= 3
                      ? idx + 1
                      : currentPage >= totalPages - 2
                        ? totalPages - 4 + idx
                        : currentPage - 2 + idx;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className="w-10 h-10 rounded-lg font-medium transition-colors"
                    style={
                      currentPage === pageNum
                        ? { backgroundColor: NAVY, color: "white" }
                        : { backgroundColor: "#f3f4f6", color: "#374151" }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              style={currentPage === totalPages ? {} : { backgroundColor: NAVY }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const UserTable = ({ users, listLoading, NAVY, onSelectUser }) => (
  <div className="divide-y divide-gray-100">
    {listLoading && users.length === 0 ? (
      <div className="text-center py-16">
        <p className="text-gray-500 text-sm">Loading users...</p>
      </div>
    ) : users.length === 0 ? (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-900 font-semibold mb-1">No users found</p>
        <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
      </div>
    ) : (
      users.map((user) => (
        <div key={user._id} className="p-4 sm:p-6 hover:bg-gray-50/70 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                style={{ backgroundColor: NAVY }}
              >
                {user.firstName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectUser?.(user._id)}
                  className="text-left w-full"
                >
                  <h3 className="font-semibold text-gray-900 truncate hover:underline">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-wrap">
              <div
                className="flex items-center gap-2 text-sm text-gray-600"
                title={user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined}
              >
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{formatLastOnline(user)}</span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {user.credits || 0}
                </span>
              </div>

              {user.unsubscribedFromEmails && (
                <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                  Unsubscribed
                </span>
              )}

              <button
                type="button"
                onClick={() => onSelectUser?.(user._id)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

export default UserTable;
