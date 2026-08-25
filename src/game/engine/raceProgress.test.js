import { describe, it, expect } from 'vitest';
import { createRaceProgress, updateRaceProgress, recordCollision, overallProgress01 } from './raceProgress.js';

const checkpoints = Array.from({ length: 4 }, (_, i) => ({ x: i * 100, y: 0, index: i }));

describe('createRaceProgress', () => {
  it('starts at checkpoint zero with no laps completed', () => {
    const progress = createRaceProgress(4, 3);
    expect(progress.nextCheckpointIndex).toBe(0);
    expect(progress.lapsCompleted).toBe(0);
    expect(progress.finished).toBe(false);
  });
});

describe('updateRaceProgress', () => {
  it('does nothing when far from the next checkpoint', () => {
    const progress = createRaceProgress(4, 3);
    const result = updateRaceProgress(progress, 5000, 5000, checkpoints, 1);
    expect(result.checkpointHit).toBe(false);
    expect(result.progress.nextCheckpointIndex).toBe(0);
  });

  it('advances to the next checkpoint when within range', () => {
    const progress = createRaceProgress(4, 3);
    const result = updateRaceProgress(progress, 0, 0, checkpoints, 1);
    expect(result.checkpointHit).toBe(true);
    expect(result.progress.nextCheckpointIndex).toBe(1);
    expect(result.lapCompleted).toBe(false);
  });

  it('completes a lap after hitting the final checkpoint', () => {
    let progress = createRaceProgress(4, 3);
    let time = 0;
    checkpoints.forEach((checkpoint) => {
      time += 5;
      const result = updateRaceProgress(progress, checkpoint.x, checkpoint.y, checkpoints, time);
      progress = result.progress;
    });
    expect(progress.lapsCompleted).toBe(1);
    expect(progress.lapTimes).toHaveLength(1);
    expect(progress.nextCheckpointIndex).toBe(0);
  });

  it('finishes the race once lapsCompleted reaches totalLaps', () => {
    let progress = createRaceProgress(1, 2);
    const single = [{ x: 0, y: 0, index: 0 }];
    let result = updateRaceProgress(progress, 0, 0, single, 5);
    progress = result.progress;
    expect(result.raceFinished).toBe(false);

    result = updateRaceProgress(progress, 0, 0, single, 10);
    expect(result.raceFinished).toBe(true);
    expect(result.progress.finished).toBe(true);
    expect(result.progress.finishTime).toBe(10);
  });

  it('is a no-op once the race is already finished', () => {
    const progress = { ...createRaceProgress(1, 1), finished: true };
    const result = updateRaceProgress(progress, 0, 0, [{ x: 0, y: 0, index: 0 }], 99);
    expect(result.checkpointHit).toBe(false);
    expect(result.progress).toBe(progress);
  });
});

describe('recordCollision', () => {
  it('increments the collision counter', () => {
    const progress = createRaceProgress(4, 3);
    const next = recordCollision(progress);
    expect(next.collisions).toBe(1);
  });
});

describe('overallProgress01', () => {
  it('is 0 at the start of the race', () => {
    expect(overallProgress01(createRaceProgress(4, 3))).toBe(0);
  });

  it('is 1 once every lap is complete', () => {
    const progress = { ...createRaceProgress(4, 3), lapsCompleted: 3, nextCheckpointIndex: 0 };
    expect(overallProgress01(progress)).toBe(1);
  });
});
