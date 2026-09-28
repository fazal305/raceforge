import { useState } from "react";
import { useGameStore, GAME_STATES } from "../../state/store.js";
import { TRACKS } from "../../data/tracks.js";
import { Button } from "../ui/Button.jsx";
import { sfx } from "../../services/audio.js";
import { formatTime } from "../../utils/format.js";
import "./Selection.css";

export function TrackSelection() {
  const setGameState = useGameStore((s) => s.setGameState);
  const selectedTrackId = useGameStore((s) => s.selectedTrackId);
  const setSelectedTrackId = useGameStore((s) => s.setSelectedTrackId);
  const unlockedTrackIds = useGameStore((s) => s.progression.unlockedTrackIds);
  const bestRaceTimesByTrack = useGameStore(
    (s) => s.progression.bestRaceTimesByTrack,
  );
  const credits = useGameStore((s) => s.progression.credits);
  const unlockTrack = useGameStore((s) => s.unlockTrack);
  const [activeId, setActiveId] = useState(selectedTrackId);

  const handlePick = (track) => {
    if (!unlockedTrackIds.includes(track.id)) return;
    sfx.uiSelect();
    setActiveId(track.id);
  };

  const handleUnlock = (track) => {
    const unlocked = unlockTrack(track.id, track.unlockCost);
    if (unlocked) sfx.checkpoint();
  };

  const handleStartRace = () => {
    setSelectedTrackId(activeId);
    sfx.uiSelect();
    setGameState(GAME_STATES.COUNTDOWN);
  };

  return (
    <div className="selection">
      <header className="selection__header">
        <p className="selection__eyebrow">Step 2 of 2</p>
        <h1 className="selection__title">Choose your track</h1>
        <p className="selection__credits">{credits} credits</p>
      </header>

      <div
        className="selection__grid"
        role="listbox"
        aria-label="Available tracks"
      >
        {TRACKS.map((track) => {
          const unlocked = unlockedTrackIds.includes(track.id);
          const isActive = activeId === track.id;
          const best = bestRaceTimesByTrack[track.id];
          return (
            <div
              key={track.id}
              role="option"
              aria-selected={isActive}
              tabIndex={unlocked ? 0 : -1}
              className={`selection-card ${isActive ? "selection-card--active" : ""} ${!unlocked ? "selection-card--locked" : ""}`}
              onClick={() => handlePick(track)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handlePick(track)
              }
            >
              <h2 className="selection-card__name">{track.name}</h2>
              <p className="selection-card__tagline">
                {track.difficulty} &middot; {track.laps} laps
              </p>
              <p className="selection-card__best">
                {best ? `Best: ${formatTime(best)}` : "No time set"}
              </p>
              {!unlocked && (
                <Button
                  variant="secondary"
                  className="selection-card__unlock"
                  disabled={credits < track.unlockCost}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlock(track);
                  }}
                >
                  Unlock &middot; {track.unlockCost}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <footer className="selection__footer">
        <Button
          variant="ghost"
          onClick={() => setGameState(GAME_STATES.CAR_SELECTION)}
        >
          Back
        </Button>
        <Button variant="primary" onClick={handleStartRace}>
          Start Race
        </Button>
      </footer>
    </div>
  );
}
