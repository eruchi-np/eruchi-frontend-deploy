import React from 'react';

const toItem = (item, index) => {
  if (item && typeof item === 'object' && (item.id != null || item.label != null)) {
    const label = String(item.label ?? item.id ?? '');
    const id = String(item.id ?? item.label ?? index);
    return { id, label };
  }
  const label = String(item ?? '');
  return { id: label, label };
};

/**
 * Matrix / grid question: rows share one set of column options (one radio choice per row).
 * value is a dictionary: { [rowId]: columnId }
 */
export default function MatrixQuestion({
  rows = [],
  columns = [],
  value = {},
  onChange,
  disabled = false,
  preview = false,
  headerRepeatEvery = 3,
  namePrefix = 'matrix',
}) {
  const rowItems = rows.map(toItem);
  const colItems = columns.map(toItem);
  const interactive = !disabled && !preview;

  const emit = (next) => {
    if (interactive && onChange) onChange(next);
  };

  const selectRadio = (rowId, colId) => {
    emit({ ...value, [rowId]: colId });
  };

  const HeaderRow = ({ className = '' }) => (
    <tr className={className}>
      <th scope="col" className="text-left font-medium text-neutral-500 py-3 pr-4 min-w-[10rem] w-[28%]" />
      {colItems.map((col) => (
        <th
          key={col.id}
          scope="col"
          className="text-center font-medium text-neutral-500 text-xs sm:text-[13px] leading-snug px-1.5 py-3 align-bottom min-w-[4.5rem]"
        >
          <span className="inline-block max-w-[6.5rem]">{col.label}</span>
        </th>
      ))}
    </tr>
  );

  const DesktopCell = ({ row, col }) => {
    const checked = value[row.id] === col.id;
    const inputName = `${namePrefix}-${row.id}-desktop`;

    return (
      <td className="text-center px-1.5 py-3.5 align-middle">
        <label className={`inline-flex items-center justify-center ${interactive ? 'cursor-pointer' : 'cursor-default'}`}>
          <input
            type="radio"
            name={inputName}
            checked={checked}
            disabled={!interactive}
            onChange={() => selectRadio(row.id, col.id)}
            className={`h-4 w-4 border-neutral-400 text-neutral-900 focus:ring-0 focus:ring-offset-0 ${
              preview ? 'opacity-40' : ''
            }`}
            aria-label={`${row.label}: ${col.label}`}
          />
        </label>
      </td>
    );
  };

  const renderDesktopRows = () => {
    const nodes = [];
    rowItems.forEach((row, index) => {
      if (index > 0 && headerRepeatEvery > 0 && index % headerRepeatEvery === 0) {
        nodes.push(<HeaderRow key={`hdr-${index}`} className="border-t border-neutral-200" />);
      }
      const zebra = index % 2 === 1;
      nodes.push(
        <tr
          key={row.id}
          className={`border-t border-neutral-100 ${zebra ? 'bg-slate-50/80' : 'bg-white'}`}
        >
          <th
            scope="row"
            className="text-left font-normal text-neutral-800 text-sm py-3.5 pr-4 align-middle"
          >
            {row.label || <span className="text-neutral-300 italic">Row label</span>}
          </th>
          {colItems.map((col) => (
            <DesktopCell key={col.id} row={row} col={col} />
          ))}
        </tr>
      );
    });
    return nodes;
  };

  if (!rowItems.length || !colItems.length) {
    return (
      <p className="text-sm text-neutral-400 italic">
        Add at least one row and one column option to preview this matrix.
      </p>
    );
  }

  return (
    <div className={preview ? 'pointer-events-none select-none' : undefined}>
      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse table-fixed min-w-[36rem]">
          <thead>
            <HeaderRow />
          </thead>
          <tbody>{renderDesktopRows()}</tbody>
        </table>
      </div>

      {/* Mobile: vertical stacks per row */}
      <div className="md:hidden space-y-6">
        {rowItems.map((row) => (
          <fieldset key={row.id} className="border-b border-neutral-100 pb-5 last:border-0">
            <legend className="text-sm font-medium text-neutral-900 mb-3 pr-2">
              {row.label || <span className="text-neutral-300 italic">Row label</span>}
            </legend>
            <div className="space-y-2.5">
              {colItems.map((col) => {
                const checked = value[row.id] === col.id;
                return (
                  <label
                    key={col.id}
                    className={`flex items-center gap-3 py-1.5 ${
                      interactive ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${namePrefix}-${row.id}-mobile`}
                      checked={checked}
                      disabled={!interactive}
                      onChange={() => selectRadio(row.id, col.id)}
                      className={`h-4 w-4 border-neutral-400 text-neutral-900 focus:ring-0 ${
                        preview ? 'opacity-40' : ''
                      }`}
                    />
                    <span className={`text-sm ${preview ? 'text-neutral-400' : 'text-neutral-700'}`}>
                      {col.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

export function emptyMatrixValue(rows = []) {
  const initial = {};
  rows.forEach((row, index) => {
    const { id } = toItem(row, index);
    initial[id] = '';
  });
  return initial;
}

export function isMatrixComplete(value, rows = []) {
  if (!rows.length) return false;
  return rows.every((row, index) => {
    const { id } = toItem(row, index);
    const selected = value?.[id];
    return selected != null && selected !== '';
  });
}
