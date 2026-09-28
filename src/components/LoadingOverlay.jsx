import "./LoadingOverlay.css";

export function LoadingOverlay({ label = "Loading" }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-overlay__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
