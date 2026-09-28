import { describe, it, expect } from "vitest";
import {
  circlesOverlap,
  resolveCircleCollision,
  isOffRoad,
  checkObstacleCollisions,
} from "./collision.js";
import { generateTrack } from "../tracks/trackGenerator.js";
import { getTrackById } from "../../data/tracks.js";

const track = generateTrack(getTrackById("harborline"));

describe("circlesOverlap", () => {
  it("detects overlap when circles are closer than their combined radius", () => {
    expect(circlesOverlap(0, 0, 10, 15, 0, 10)).toBe(true);
  });

  it("detects no overlap when circles are far apart", () => {
    expect(circlesOverlap(0, 0, 10, 100, 0, 10)).toBe(false);
  });
});

describe("resolveCircleCollision", () => {
  it("returns zero overlap for non-colliding circles", () => {
    const result = resolveCircleCollision(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      10,
      10,
    );
    expect(result.overlap).toBe(0);
  });

  it("pushes overlapping circles apart symmetrically", () => {
    const result = resolveCircleCollision(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      10,
      10,
    );
    expect(result.overlap).toBeGreaterThan(0);
    expect(result.pushA.x).toBeLessThan(0);
    expect(result.pushB.x).toBeGreaterThan(0);
    expect(result.impact).toBeGreaterThan(0);
    expect(result.impact).toBeLessThanOrEqual(1);
  });
});

describe("isOffRoad", () => {
  it("reports on-road for a point on the centerline", () => {
    const point = track.centerline[0];
    expect(isOffRoad(track, point.x, point.y)).toBe(false);
  });

  it("reports off-road for a point far outside the track bounds", () => {
    expect(
      isOffRoad(track, track.bounds.maxX + 5000, track.bounds.maxY + 5000),
    ).toBe(true);
  });
});

describe("checkObstacleCollisions", () => {
  it("returns an empty array far from any obstacle", () => {
    const hits = checkObstacleCollisions(
      track,
      track.bounds.maxX + 5000,
      track.bounds.maxY + 5000,
      13,
    );
    expect(hits).toEqual([]);
  });

  it("finds an obstacle placed exactly at the query point", () => {
    if (track.obstacles.length === 0) return;
    const obstacle = track.obstacles[0];
    const hits = checkObstacleCollisions(track, obstacle.x, obstacle.y, 13);
    expect(hits).toContain(obstacle);
  });
});
