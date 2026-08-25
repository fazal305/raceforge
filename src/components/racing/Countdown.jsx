import './Countdown.css';

export function Countdown({ value }) {
  return (
    <div className="countdown" role="status" aria-live="assertive">
      <span key={value} className="countdown__value">
        {value}
      </span>
    </div>
  );
}
