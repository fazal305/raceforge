import { createRng, rangeFrom } from "../../utils/random.js";
import { catmullRom, distance } from "../../utils/math.js";

const SAMPLES_PER_SEGMENT = 24;
const CHECKPOINT_COUNT = 8;

function buildControlPoints(rng, config) {
  const points = [];
  const { controlPoints, radius, irregularity } = config;
  for (let i = 0; i < controlPoints; i += 1) {
    const angle = (i / controlPoints) * Math.PI * 2;
    const jitteredRadius =
      radius * (1 + rangeFrom(rng, -irregularity, irregularity));
    const angleJitter = rangeFrom(rng, -0.12, 0.12) * (Math.PI / controlPoints);
    points.push({
      x: Math.cos(angle + angleJitter) * jitteredRadius,
      y: Math.sin(angle + angleJitter) * jitteredRadius,
    });
  }
  return points;
}

function sampleClosedSpline(controlPoints) {
  const n = controlPoints.length;
  const samples = [];
  for (let i = 0; i < n; i += 1) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s += 1) {
      const t = s / SAMPLES_PER_SEGMENT;
      samples.push(catmullRom(p0, p1, p2, p3, t));
    }
  }
  return samples;
}

function withArcLength(centerline) {
  const cumulative = [0];
  for (let i = 1; i < centerline.length; i += 1) {
    const prev = centerline[i - 1];
    const curr = centerline[i];
    cumulative.push(
      cumulative[i - 1] + distance(prev.x, prev.y, curr.x, curr.y),
    );
  }
  const last = centerline[centerline.length - 1];
  const first = centerline[0];
  const closingLength =
    cumulative[cumulative.length - 1] +
    distance(last.x, last.y, first.x, first.y);
  return { cumulative, length: closingLength };
}

function buildCheckpoints(centerline, cumulative, totalLength) {
  const checkpoints = [];
  for (let c = 0; c < CHECKPOINT_COUNT; c += 1) {
    const targetDistance = (c / CHECKPOINT_COUNT) * totalLength;
    let index = 0;
    while (
      index < cumulative.length - 1 &&
      cumulative[index] < targetDistance
    ) {
      index += 1;
    }
    const point = centerline[index];
    const next = centerline[(index + 1) % centerline.length];
    const heading = Math.atan2(next.y - point.y, next.x - point.x);
    checkpoints.push({
      index: c,
      x: point.x,
      y: point.y,
      heading,
      progress: c / CHECKPOINT_COUNT,
      centerlineIndex: index,
    });
  }
  return checkpoints;
}

function scatterObstacles(rng, centerline, roadWidth, density) {
  const obstacleCount = Math.round(centerline.length * density * 0.03);
  const obstacles = [];
  for (let i = 0; i < obstacleCount; i += 1) {
    const index = Math.floor(rangeFrom(rng, 0, centerline.length));
    const point = centerline[index];
    const next = centerline[(index + 1) % centerline.length];
    const heading = Math.atan2(next.y - point.y, next.x - point.x);
    const normalAngle = heading + Math.PI / 2;
    const offset =
      rangeFrom(rng, roadWidth * 0.2, roadWidth * 0.4) * (rng() > 0.5 ? 1 : -1);
    obstacles.push({
      x: point.x + Math.cos(normalAngle) * offset,
      y: point.y + Math.sin(normalAngle) * offset,
      radius: rangeFrom(rng, 8, 14),
    });
  }
  return obstacles;
}

function computeBounds(centerline, padding) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  centerline.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
}

/**
 * Generates a closed-loop track from a seeded config. Deterministic: the
 * same seed always yields the same centerline, checkpoints and obstacles.
 */
export function generateTrack(config) {
  const rng = createRng(config.seed);
  const controlPoints = buildControlPoints(rng, config);
  const centerline = sampleClosedSpline(controlPoints);
  const { cumulative, length } = withArcLength(centerline);
  const checkpoints = buildCheckpoints(centerline, cumulative, length);
  const obstacles = scatterObstacles(
    rng,
    centerline,
    config.roadWidth,
    config.obstacleDensity,
  );
  const bounds = computeBounds(centerline, config.roadWidth * 2);

  const start = centerline[0];
  const startNext = centerline[1];
  const startHeading = Math.atan2(startNext.y - start.y, startNext.x - start.x);

  return {
    id: config.id,
    centerline,
    cumulative,
    length,
    checkpoints,
    obstacles,
    bounds,
    roadWidth: config.roadWidth,
    startPosition: { x: start.x, y: start.y },
    startHeading,
    laps: config.laps,
  };
}

/** Finds the nearest centerline sample to (x, y) and its signed lateral offset. */
export function nearestCenterlinePoint(track, x, y) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < track.centerline.length; i += 1) {
    const p = track.centerline[i];
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }
  const point = track.centerline[bestIndex];
  const next = track.centerline[(bestIndex + 1) % track.centerline.length];
  const heading = Math.atan2(next.y - point.y, next.x - point.x);
  const toCar = Math.atan2(y - point.y, x - point.x);
  const lateral =
    Math.sqrt(bestDistance) * Math.sign(Math.sin(toCar - heading) || 1);
  return {
    index: bestIndex,
    distance: Math.sqrt(bestDistance),
    lateral,
    heading,
  };
}
