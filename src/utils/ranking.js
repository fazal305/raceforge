/**
 * Computes race standings from each entity's race progress. Finished
 * entities are ranked by finish time; still-racing entities are ranked by
 * laps completed then checkpoint progress within the current lap.
 */
export function computeStandings(entries) {
  const finished = entries.filter((e) => e.progress.finished);
  const racing = entries.filter((e) => !e.progress.finished);

  finished.sort((a, b) => a.progress.finishTime - b.progress.finishTime);
  racing.sort((a, b) => {
    if (b.progress.lapsCompleted !== a.progress.lapsCompleted) {
      return b.progress.lapsCompleted - a.progress.lapsCompleted;
    }
    return b.progress.nextCheckpointIndex - a.progress.nextCheckpointIndex;
  });

  return [...finished, ...racing].map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    position: index + 1,
    finished: entry.progress.finished,
  }));
}
