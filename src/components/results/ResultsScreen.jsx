import { useEffect } from 'react';
import { useGameStore, GAME_STATES } from '../../state/store.js';
import { getTrackById } from '../../data/tracks.js';
import { formatTime } from '../../utils/format.js';
import { Button } from '../ui/Button.jsx';
import { sfx } from '../../services/audio.js';
import './ResultsScreen.css';

const ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd' };

export function ResultsScreen() {
  const results = useGameStore((s) => s.lastRaceResults);
  const selectedTrackId = useGameStore((s) => s.selectedTrackId);
  const setGameState = useGameStore((s) => s.setGameState);

  useEffect(() => {
    if (!results) setGameState(GAME_STATES.MENU);
  }, [results, setGameState]);

  if (!results) return null;

  const track = getTrackById(selectedTrackId);

  const handleRetry = () => {
    sfx.uiSelect();
    setGameState(GAME_STATES.COUNTDOWN);
  };

  const handleNextRace = () => {
    sfx.uiSelect();
    setGameState(GAME_STATES.TRACK_SELECTION);
  };

  const handleMenu = () => {
    sfx.uiClick();
    setGameState(GAME_STATES.MENU);
  };

  return (
    <div className="results">
      <div className="results__panel">
        <p className="results__eyebrow">{track.name}</p>
        <h1 className="results__position">
          {ORDINAL[results.playerPosition] ?? `${results.playerPosition}th`}
        </h1>

        {results.isPersonalBest && <p className="results__pb">New personal best</p>}

        <dl className="results__stats">
          <div>
            <dt>Race Time</dt>
            <dd>{formatTime(results.raceTime)}</dd>
          </div>
          <div>
            <dt>Best Lap</dt>
            <dd>{formatTime(results.bestLapTime)}</dd>
          </div>
          <div>
            <dt>Laps</dt>
            <dd>{results.lapTimes.length}</dd>
          </div>
          <div>
            <dt>Collisions</dt>
            <dd>{results.collisions}</dd>
          </div>
          <div>
            <dt>Credits Earned</dt>
            <dd>+{results.creditsEarned}</dd>
          </div>
        </dl>

        <ol className="results__standings" aria-label="Final standings">
          {results.standings.map((entry) => (
            <li key={entry.id} className={entry.id === 'player' ? 'results__standing--player' : ''}>
              <span>{entry.position}</span>
              <span>{entry.name}</span>
            </li>
          ))}
        </ol>

        <div className="results__actions">
          <Button variant="ghost" onClick={handleMenu}>
            Menu
          </Button>
          <Button variant="secondary" onClick={handleRetry}>
            Retry
          </Button>
          <Button variant="primary" onClick={handleNextRace}>
            Next Race
          </Button>
        </div>
      </div>
    </div>
  );
}
