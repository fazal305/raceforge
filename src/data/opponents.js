/**
 * Opponent personalities. speedFactor scales their target speed relative
 * to the player's car top speed; aggressiveness affects how tightly they
 * cut corners and how readily they push through minor contact.
 */
export const OPPONENT_PRESETS = [
  { id: 'rook', name: 'Rook', color: '#6fb7ff', speedFactor: 0.82, aggressiveness: 0.3 },
  { id: 'blaze', name: 'Blaze', color: '#e5484d', speedFactor: 0.93, aggressiveness: 0.65 },
  { id: 'echo', name: 'Echo', color: '#3ecf8e', speedFactor: 0.88, aggressiveness: 0.45 },
  { id: 'vector', name: 'Vector', color: '#f2c14e', speedFactor: 0.97, aggressiveness: 0.8 },
  { id: 'nomad', name: 'Nomad', color: '#a78bfa', speedFactor: 0.85, aggressiveness: 0.4 },
];

export function pickOpponents(count) {
  return OPPONENT_PRESETS.slice(0, count);
}
