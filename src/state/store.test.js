import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./store.js";

const initialProgression = useGameStore.getState().progression;

beforeEach(() => {
  window.localStorage.clear();
  useGameStore.setState({
    progression: initialProgression,
    gameState: "MENU",
    lastRaceResults: null,
  });
});

describe("recordRaceResult", () => {
  it("awards more credits for a win than a lower finish", () => {
    const before = useGameStore.getState().progression.credits;
    const { creditsEarned } = useGameStore
      .getState()
      .recordRaceResult("harborline", {
        playerPosition: 1,
        raceTime: 60,
        bestLapTime: 20,
      });
    const after = useGameStore.getState().progression.credits;
    expect(after - before).toBe(creditsEarned);
    expect(creditsEarned).toBeGreaterThan(200 / 4);
  });

  it("tracks a win and increments total races", () => {
    useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 1,
      raceTime: 60,
      bestLapTime: 20,
    });
    const progression = useGameStore.getState().progression;
    expect(progression.wins).toBe(1);
    expect(progression.totalRaces).toBe(1);
  });

  it("only records a best lap time when it improves on the previous one", () => {
    useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 2,
      raceTime: 60,
      bestLapTime: 20,
    });
    useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 2,
      raceTime: 55,
      bestLapTime: 25,
    });
    expect(
      useGameStore.getState().progression.bestLapTimesByTrack.harborline,
    ).toBe(20);
  });

  it("reports isPersonalBest only when the race time actually improves", () => {
    const first = useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 2,
      raceTime: 60,
      bestLapTime: 20,
    });
    expect(first.isPersonalBest).toBe(true);

    const second = useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 2,
      raceTime: 70,
      bestLapTime: 20,
    });
    expect(second.isPersonalBest).toBe(false);
  });
});

describe("unlockCar", () => {
  it("refuses to unlock when credits are insufficient", () => {
    useGameStore.setState((state) => ({
      progression: { ...state.progression, credits: 0 },
    }));
    const unlocked = useGameStore.getState().unlockCar("brawler", 1200);
    expect(unlocked).toBe(false);
    expect(useGameStore.getState().progression.unlockedCarIds).not.toContain(
      "brawler",
    );
  });

  it("deducts credits and unlocks when affordable", () => {
    useGameStore.setState((state) => ({
      progression: { ...state.progression, credits: 2000 },
    }));
    const unlocked = useGameStore.getState().unlockCar("brawler", 1200);
    expect(unlocked).toBe(true);
    expect(useGameStore.getState().progression.credits).toBe(800);
    expect(useGameStore.getState().progression.unlockedCarIds).toContain(
      "brawler",
    );
  });
});

describe("resetProgress", () => {
  it("restores progression to its initial shape", () => {
    useGameStore.getState().recordRaceResult("harborline", {
      playerPosition: 1,
      raceTime: 60,
      bestLapTime: 20,
    });
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().progression.totalRaces).toBe(0);
    expect(useGameStore.getState().progression.credits).toBe(
      initialProgression.credits,
    );
  });
});
