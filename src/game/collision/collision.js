import { nearestCenterlinePoint } from "../tracks/trackGenerator.js";

export function circlesOverlap(ax, ay, aRadius, bx, by, bRadius) {
  const dx = bx - ax;
  const dy = by - ay;
  const distanceSq = dx * dx + dy * dy;
  const minDistance = aRadius + bRadius;
  return distanceSq < minDistance * minDistance;
}

/**
 * Resolves an overlap between two circular bodies by pushing them apart
 * along the collision normal and returns an impact magnitude (0-1) callers
 * can use to trigger effects/sound/speed loss.
 */
export function resolveCircleCollision(a, b, aRadius, bRadius) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 0.0001;
  const overlap = aRadius + bRadius - dist;
  if (overlap <= 0) return { overlap: 0 };

  const nx = dx / dist;
  const ny = dy / dist;
  const push = overlap / 2;

  return {
    overlap,
    normal: { x: nx, y: ny },
    pushA: { x: -nx * push, y: -ny * push },
    pushB: { x: nx * push, y: ny * push },
    impact: Math.min(1, overlap / (aRadius + bRadius)),
  };
}

export function isOffRoad(track, x, y) {
  const nearest = nearestCenterlinePoint(track, x, y);
  return nearest.distance > track.roadWidth / 2;
}

export function checkObstacleCollisions(track, carX, carY, carRadius) {
  return track.obstacles.filter((obstacle) =>
    circlesOverlap(
      carX,
      carY,
      carRadius,
      obstacle.x,
      obstacle.y,
      obstacle.radius,
    ),
  );
}
