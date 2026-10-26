import { toMatrixItem } from "./validation";

export default function MatrixFlow({ rows, columns, value, onChange, namePrefix }) {
  const rowItems = rows.map(toMatrixItem);
  const colItems = columns.map(toMatrixItem);

  const select = (rowId, colId) => {
    onChange({ ...value, [rowId]: colId });
  };

  return (
    <>
      <div className="mxw">
        <table className="mx">
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

      <div className="mxm">
        {rowItems.map((row) => (
          <fieldset key={row.id}>
            <legend>{row.label}</legend>
            <div className="chs">
              {colItems.map((col) => {
                const on = value[row.id] === col.id;
                return (
                  <label key={col.id} className={`ch${on ? " on" : ""}`}>
                    <input
                      className="sr"
                      type="radio"
                      name={`${namePrefix}-${row.id}-m`}
                      checked={on}
                      onChange={() => select(row.id, col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </>
  );
}
