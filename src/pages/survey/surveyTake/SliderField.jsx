export default function SliderField({ question, value, onChange, labelledBy }) {
  const min = Number.isFinite(Number(question.minValue))
    ? Number(question.minValue)
    : 0;
  const max = Number.isFinite(Number(question.maxValue))
    ? Number(question.maxValue)
    : 10;
  const untouched = value == null || value === "";
  const current = untouched ? min : Number(value);
  const span = Math.max(1, max - min);
  const fraction = untouched ? 0 : (current - min) / span;
  const ticks = [];
  const step = span > 12 ? Math.ceil(span / 10) : 1;
  for (let n = min; n <= max; n += step) ticks.push(n);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);

  return (
    <>
      <div className={`sl-v${untouched ? " un" : ""}`}>
        {untouched ? (
          <span className="hint">Drag or tap the bar to answer</span>
        ) : (
          <>
            {current}
            <small>
              out of {max}
            </small>
          </>
        )}
      </div>
      <input
        className={`rng${untouched ? " un" : ""}`}
        type="range"
        min={min}
        max={max}
        value={current}
        style={{ "--f": fraction }}
        aria-labelledby={labelledBy}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="ticks" aria-hidden="true">
        {ticks.map((n) => (
          <span key={n}>
            <em className={!untouched && n === current ? "cur" : undefined}>{n}</em>
          </span>
        ))}
      </div>
    </>
  );
}
