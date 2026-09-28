import { distance } from "../../utils/math.js";

const CHECKPOINT_RADIUS = 70;

export function createRaceProgress(totalCheckpoints, totalLaps) {
  return {
    nextCheckpointIndex: 0,
    totalCheckpoints,
    totalLaps,
    lapsCompleted: 0,
    lapTimes: [],
    currentLapStartTime: 0,
    bestLapTime: null,
    finished: false,
    finishTime: null,
    collisions: 0,
  };
}

/**
 * Advances checkpoint/lap state for one entity. Pure function: given the
 * current progress, entity position and the track's checkpoint list, it
 * returns the next progress object plus flags describing what just
 * happened this tick (checkpointHit / lapCompleted / raceFinished) so the
 * caller can trigger effects without re-deriving them.
 */
export function updateRaceProgress(progress, x, y, checkpoints, currentTime) {
  if (progress.finished) {
    return {
      progress,
      checkpointHit: false,
      lapCompleted: false,
      raceFinished: false,
    };
  }

  const target = checkpoints[progress.nextCheckpointIndex];
  const withinRange = distance(x, y, target.x, target.y) <= CHECKPOINT_RADIUS;

  if (!withinRange) {
    return {
      progress,
      checkpointHit: false,
      lapCompleted: false,
      raceFinished: false,
    };
  }

  const isLastCheckpoint =
    progress.nextCheckpointIndex === progress.totalCheckpoints - 1;
  const nextCheckpointIndex = isLastCheckpoint
    ? 0
    : progress.nextCheckpointIndex + 1;

  if (!isLastCheckpoint) {
    return {
      progress: { ...progress, nextCheckpointIndex },
      checkpointHit: true,
      lapCompleted: false,
      raceFinished: false,
    };
  }

  const lapTime = currentTime - progress.currentLapStartTime;
  const lapTimes = [...progress.lapTimes, lapTime];
  const bestLapTime =
    progress.bestLapTime === null
      ? lapTime
      : Math.min(progress.bestLapTime, lapTime);
  const lapsCompleted = progress.lapsCompleted + 1;
  const raceFinished = lapsCompleted >= progress.totalLaps;

  return {
    progress: {
      ...progress,
      nextCheckpointIndex,
      lapsCompleted,
      lapTimes,
      bestLapTime,
      currentLapStartTime: currentTime,
      finished: raceFinished,
      finishTime: raceFinished ? currentTime : null,
    },
    checkpointHit: true,
    lapCompleted: true,
    raceFinished,
  };
}

export function recordCollision(progress) {
  return { ...progress, collisions: progress.collisions + 1 };
}

/** Race completion progress 0-1, used for HUD checkpoint bars and minimap. */
export function overallProgress01(progress) {
  const perLap = progress.nextCheckpointIndex / progress.totalCheckpoints;
  return (progress.lapsCompleted + perLap) / progress.totalLaps;
}
