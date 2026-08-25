import { describe, it, expect } from 'vitest';
import { generateTrack, nearestCenterlinePoint } from './trackGenerator.js';
import { TRACKS, getTrackById } from '../../data/tracks.js';

describe('generateTrack', () => {
  it('is deterministic for a given seed', () => {
    const config = getTrackById('harborline');
    const a = generateTrack(config);
    const b = generateTrack(config);
    expect(a.centerline).toEqual(b.centerline);
    expect(a.checkpoints).toEqual(b.checkpoints);
    expect(a.obstacles).toEqual(b.obstacles);
  });

  it('produces a different layout for a different seed', () => {
    const a = generateTrack(getTrackById('harborline'));
    const b = generateTrack(getTrackById('switchback'));
    expect(a.centerline).not.toEqual(b.centerline);
  });

  it('generates a valid closed loop for every defined track', () => {
    TRACKS.forEach((config) => {
      const track = generateTrack(config);
      expect(track.centerline.length).toBeGreaterThan(0);
      expect(track.checkpoints).toHaveLength(8);
      expect(track.length).toBeGreaterThan(0);
      expect(track.laps).toBe(config.laps);
    });
  });
});

describe('nearestCenterlinePoint', () => {
  it('returns near-zero distance for a point on the centerline', () => {
    const track = generateTrack(getTrackById('harborline'));
    const point = track.centerline[10];
    const nearest = nearestCenterlinePoint(track, point.x, point.y);
    expect(nearest.distance).toBeLessThan(1);
  });

  it('returns a large distance far from the track', () => {
    const track = generateTrack(getTrackById('harborline'));
    const nearest = nearestCenterlinePoint(track, track.bounds.maxX + 5000, track.bounds.maxY + 5000);
    expect(nearest.distance).toBeGreaterThan(1000);
  });
});
