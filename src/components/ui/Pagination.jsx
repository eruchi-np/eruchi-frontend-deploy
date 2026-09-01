import React from 'react';

const NAVY = '#1B2A4A';

function pageWindow(current, total) {
  const count = Math.min(5, total);
  return Array.from({ length: count }, (_, idx) => {
    if (total <= 5) return idx + 1;
    if (current <= 3) return idx + 1;
    if (current >= total - 2) return total - 4 + idx;
    return current - 2 + idx;
  });
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  label = 'results'
}) {
  if (!totalPages || totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total || page * pageSize);

  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8"
      aria-label={`${label} pagination`}
    >
      {typeof total === 'number' && (
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{start}</span> to{' '}
          <span className="font-semibold text-gray-900">{end}</span> of{' '}
          <span className="font-semibold text-gray-900">{total}</span> {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          style={page === 1 ? undefined : { backgroundColor: NAVY }}
        >
          Previous
        </button>
        {pageWindow(page, totalPages).map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onChange(pageNum)}
            className="w-10 h-10 rounded-lg text-sm font-medium"
            style={
              page === pageNum
                ? { backgroundColor: NAVY, color: 'white' }
                : { backgroundColor: '#f3f4f6', color: '#374151' }
            }
          >
            {pageNum}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          style={page === totalPages ? undefined : { backgroundColor: NAVY }}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
