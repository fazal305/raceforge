export function formatTime(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '--:--.--';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toFixed(2).padStart(5, '0')}`;
}

export function formatSpeed(pixelsPerSecond) {
  // Arbitrary but consistent px/s -> "mph"-feeling display unit.
  return Math.round(pixelsPerSecond * 0.6);
}
