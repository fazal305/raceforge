/**
 * Tracks are data, not hand-authored geometry. Each entry seeds the
 * procedural generator in src/game/tracks/trackGenerator.js -- the same
 * seed always produces the same layout, so a track is reproducible without
 * needing authored art.
 */
export const TRACKS = [
  {
    id: "harborline",
    name: "Harborline Circuit",
    difficulty: "Easy",
    laps: 3,
    theme: "dusk",
    seed: 1337,
    controlPoints: 8,
    roadWidth: 130,
    radius: 420,
    irregularity: 0.18,
    obstacleDensity: 0.05,
    aiDifficulty: 0.35,
    unlockedByDefault: true,
  },
  {
    id: "switchback",
    name: "Switchback Pass",
    difficulty: "Medium",
    laps: 3,
    theme: "night",
    seed: 8842,
    controlPoints: 10,
    roadWidth: 110,
    radius: 460,
    irregularity: 0.32,
    obstacleDensity: 0.1,
    aiDifficulty: 0.55,
    unlockedByDefault: true,
  },
  {
    id: "ironvale",
    name: "Ironvale Speedway",
    difficulty: "Hard",
    laps: 4,
    theme: "industrial",
    seed: 4471,
    controlPoints: 12,
    roadWidth: 95,
    radius: 500,
    irregularity: 0.42,
    obstacleDensity: 0.16,
    aiDifficulty: 0.75,
    unlockedByDefault: false,
    unlockCost: 800,
  },
];

export function getTrackById(id) {
  return TRACKS.find((track) => track.id === id) ?? TRACKS[0];
}
