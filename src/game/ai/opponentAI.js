import { nearestCenterlinePoint } from '../tracks/trackGenerator.js';
import { normalizeAngle, clamp } from '../../utils/math.js';

const LOOKAHEAD_SAMPLES = 14;
const OBSTACLE_AVOID_RADIUS = 90;

/**
 * Simple waypoint-following AI: find the nearest centerline point, steer
 * toward a point further ahead on the line, throttle down for sharp
 * upcoming turns, and nudge away from obstacles it is about to hit.
 * Deliberately not a full path-planner -- arcade opponents, not a
 * simulation.
 */
export function computeOpponentInput(carState, track, preset) {
  const nearest = nearestCenterlinePoint(track, carState.x, carState.y);
  const lookaheadIndex = (nearest.index + LOOKAHEAD_SAMPLES) % track.centerline.length;
  const target = track.centerline[lookaheadIndex];

  const angleToTarget = Math.atan2(target.y - carState.y, target.x - carState.x);
  let angleDiff = normalizeAngle(angleToTarget - carState.heading);

  const nearbyObstacle = track.obstacles.find(
    (obstacle) =>
      Math.hypot(obstacle.x - carState.x, obstacle.y - carState.y) < OBSTACLE_AVOID_RADIUS,
  );
  if (nearbyObstacle) {
    const awayAngle = Math.atan2(carState.y - nearbyObstacle.y, carState.x - nearbyObstacle.x);
    angleDiff = normalizeAngle(angleDiff * 0.4 + normalizeAngle(awayAngle - carState.heading) * 0.6);
  }

  const steer = clamp(angleDiff * 1.4, -1, 1);
  const sharpTurn = Math.abs(angleDiff) > 0.5;

  const throttle = sharpTurn ? preset.speedFactor * (1 - preset.aggressiveness * 0.4) : preset.speedFactor;
  const brake = sharpTurn && Math.abs(angleDiff) > 1.0 ? (1 - preset.aggressiveness) * 0.5 : 0;

  return { throttle, brake, steer };
}
