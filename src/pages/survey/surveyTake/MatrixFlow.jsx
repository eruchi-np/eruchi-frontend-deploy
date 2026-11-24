import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const nodes = [headRef.current, bodyRef.current].filter(Boolean);
    const last = new Map();

    const remember = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      last.set(event.currentTarget, { x: touch.clientX, y: touch.clientY });
    };

    const holdEdge = (event) => {
      const el = event.currentTarget;
      const touch = event.touches[0];
      const prev = last.get(el);
      if (!touch || !prev) return;
      const dx = touch.clientX - prev.x;
      const dy = touch.clientY - prev.y;
      last.set(el, { x: touch.clientX, y: touch.clientY });
      if (Math.abs(dx) <= Math.abs(dy)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;
      if ((atStart && dx > 0) || (atEnd && dx < 0)) event.preventDefault();
    };

    const forget = (event) => last.delete(event.currentTarget);

    nodes.forEach((el) => {
      el.addEventListener("touchstart", remember, { passive: true });
      el.addEventListener("touchmove", holdEdge, { passive: false });
      el.addEventListener("touchend", forget);
      el.addEventListener("touchcancel", forget);
    });

    return () => {
      nodes.forEach((el) => {
        el.removeEventListener("touchstart", remember);
        el.removeEventListener("touchmove", holdEdge);
        el.removeEventListener("touchend", forget);
        el.removeEventListener("touchcancel", forget);
      });
    };
  }, []);

  return (
    <>
    <div className="mxm">
      {rowItems.map((row) => (
        <fieldset key={row.id}>
          <legend>{row.label}</legend>
          <div className="chs" role="radiogroup" aria-label={row.label}>
            {colItems.map((col) => {
              const on = value[row.id] === col.id;
              return (
                <label key={col.id} className={`ch${on ? " on" : ""}`}>
                  <input
                    className="sr"
                    type="radio"
                    name={`${namePrefix}-pills-${row.id}`}
                    checked={on}
                    onChange={() => select(row.id, col.id)}
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
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
    </>
  );
}
