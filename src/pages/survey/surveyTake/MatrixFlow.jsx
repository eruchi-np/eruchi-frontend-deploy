import { useRef } from "react";
import { toMatrixItem } from "./validation";

function MatrixCols({ columns }) {
  return (
    <colgroup>
      <col className="mx-brand" />
      {columns.map((col) => (
        <col key={col.id} />
      ))}
    </colgroup>
  );
}

export default function MatrixFlow({ rows, columns, value, onChange, namePrefix }) {
  const rowItems = rows.map(toMatrixItem);
  const colItems = columns.map(toMatrixItem);
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const syncing = useRef(false);

  const select = (rowId, colId) => {
    onChange({ ...value, [rowId]: colId });
  };

  const syncScroll = (from) => {
    const head = headRef.current;
    const body = bodyRef.current;
    if (!head || !body || syncing.current) return;
    const to = from === head ? body : head;
    if (to.scrollLeft === from.scrollLeft) return;
    syncing.current = true;
    to.scrollLeft = from.scrollLeft;
    syncing.current = false;
  };

  return (
    <div className="mx-block" style={{ "--mx-cols": colItems.length }}>
      <div className="mx-head-sticky">
        <div
          className="mx-head-scroll"
          ref={headRef}
          onScroll={(event) => syncScroll(event.currentTarget)}
          aria-hidden="true"
        >
          <table className="mx">
            <MatrixCols columns={colItems} />
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr">Row</span>
                </th>
                {colItems.map((col) => (
                  <th key={col.id} scope="col">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      </div>

      <div className="mxw" ref={bodyRef} onScroll={(event) => syncScroll(event.currentTarget)}>
        <table className="mx">
          <MatrixCols columns={colItems} />
          <thead className="mx-sr-head">
            <tr>
              <th scope="col">Row</th>
              {colItems.map((col) => (
                <th key={col.id} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowItems.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {colItems.map((col) => {
                  const on = value[row.id] === col.id;
                  return (
                    <td key={col.id}>
                      <label className={`mxc${on ? " on" : ""}`}>
                        <input
                          className="sr"
                          type="radio"
                          name={`${namePrefix}-${row.id}`}
                          checked={on}
                          onChange={() => select(row.id, col.id)}
                          aria-label={`${row.label}: ${col.label}`}
                        />
                        <span className="rb" />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
