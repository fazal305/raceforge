import { describe, it, expect } from "vitest";
import { computeStandings } from "./ranking.js";

function progress({
  lapsCompleted = 0,
  nextCheckpointIndex = 0,
  finished = false,
  finishTime = null,
}) {
  return { lapsCompleted, nextCheckpointIndex, finished, finishTime };
}

describe("computeStandings", () => {
  it("ranks finished entries by finish time, ahead of anyone still racing", () => {
    const entries = [
      {
        id: "a",
        name: "A",
        progress: progress({ finished: true, finishTime: 40 }),
      },
      { id: "b", name: "B", progress: progress({ lapsCompleted: 2 }) },
      {
        id: "c",
        name: "C",
        progress: progress({ finished: true, finishTime: 20 }),
      },
    ];
    const standings = computeStandings(entries);
    expect(standings.map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(standings[0].position).toBe(1);
  });

  it("ranks still-racing entries by laps completed, then checkpoint progress", () => {
    const entries = [
      {
        id: "a",
        name: "A",
        progress: progress({ lapsCompleted: 1, nextCheckpointIndex: 2 }),
      },
      {
        id: "b",
        name: "B",
        progress: progress({ lapsCompleted: 2, nextCheckpointIndex: 0 }),
      },
      {
        id: "c",
        name: "C",
        progress: progress({ lapsCompleted: 1, nextCheckpointIndex: 5 }),
      },
    ];
    const standings = computeStandings(entries);
    expect(standings.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });
});
