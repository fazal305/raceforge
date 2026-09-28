import "./StatBar.css";

export function StatBar({ label, value }) {
  const percent = Math.round(value * 100);
  return (
    <div className="stat-bar">
      <span className="stat-bar__label">{label}</span>
      <div
        className="stat-bar__track"
        role="meter"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="stat-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
