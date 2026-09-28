import { describe, it, expect } from "vitest";
import { stepCarPhysics, createInitialCarState } from "./physics.js";

const stats = {
  acceleration: 0.6,
  topSpeed: 0.6,
  handling: 0.6,
  braking: 0.6,
  weight: 0.5,
};

describe("stepCarPhysics", () => {
  it("accelerates forward under throttle", () => {
    const state = createInitialCarState(0, 0, 0);
    const next = stepCarPhysics(
      state,
      { throttle: 1, brake: 0, steer: 0 },
      stats,
      1 / 60,
    );
    expect(next.speed).toBeGreaterThan(0);
    expect(next.x).toBeGreaterThan(0);
  });

  it("never exceeds the computed max speed", () => {
    let state = createInitialCarState(0, 0, 0);
    for (let i = 0; i < 600; i += 1) {
      state = stepCarPhysics(
        state,
        { throttle: 1, brake: 0, steer: 0 },
        stats,
        1 / 60,
      );
    }
    expect(state.speed).toBeLessThanOrEqual(state.maxSpeed + 0.001);
  });

  it("decelerates from friction alone", () => {
    let state = { ...createInitialCarState(0, 0, 0), speed: 100 };
    state = stepCarPhysics(
      state,
      { throttle: 0, brake: 0, steer: 0 },
      stats,
      1 / 60,
    );
    expect(state.speed).toBeLessThan(100);
  });

  it("brakes toward zero and permits limited reverse", () => {
    let state = { ...createInitialCarState(0, 0, 0), speed: 5 };
    for (let i = 0; i < 120; i += 1) {
      state = stepCarPhysics(
        state,
        { throttle: 0, brake: 1, steer: 0 },
        stats,
        1 / 60,
      );
    }
    expect(state.speed).toBeLessThan(0);
    expect(state.speed).toBeGreaterThanOrEqual(-state.maxSpeed * 0.35 - 0.001);
  });

  it("turns a stationary car far more slowly than one at speed", () => {
    const state = createInitialCarState(0, 0, 0);
    const stationaryTurn = Math.abs(
      stepCarPhysics(state, { throttle: 0, brake: 0, steer: 1 }, stats, 1 / 60)
        .heading,
    );
    const movingState = { ...state, speed: state.maxSpeed };
    const movingTurn = Math.abs(
      stepCarPhysics(
        movingState,
        { throttle: 0, brake: 0, steer: 1 },
        stats,
        1 / 60,
      ).heading,
    );
    expect(stationaryTurn).toBeLessThan(movingTurn);
  });

  it("reduces max speed off-road", () => {
    const state = createInitialCarState(0, 0, 0);
    const onRoad = stepCarPhysics(
      state,
      { throttle: 1, brake: 0, steer: 0 },
      stats,
      1 / 60,
      false,
    );
    const offRoad = stepCarPhysics(
      state,
      { throttle: 1, brake: 0, steer: 0 },
      stats,
      1 / 60,
      true,
    );
    expect(offRoad.maxSpeed).toBeLessThan(onRoad.maxSpeed);
  });

  it("gives a higher top-speed car a higher max speed than a lower one", () => {
    const state = createInitialCarState(0, 0, 0);
    const fast = stepCarPhysics(
      state,
      { throttle: 1, brake: 0, steer: 0 },
      { ...stats, topSpeed: 0.9 },
      1 / 60,
    );
    const slow = stepCarPhysics(
      state,
      { throttle: 1, brake: 0, steer: 0 },
      { ...stats, topSpeed: 0.3 },
      1 / 60,
    );
    expect(fast.maxSpeed).toBeGreaterThan(slow.maxSpeed);
  });
});
