import { useGameStore, GAME_STATES } from "../../state/store.js";
import { Button } from "../ui/Button.jsx";
import { sfx, initAudio } from "../../services/audio.js";
import "./MainMenu.css";

export function MainMenu() {
  const setGameState = useGameStore((s) => s.setGameState);
  const progression = useGameStore((s) => s.progression);

  const handleStart = () => {
    initAudio();
    sfx.uiSelect();
    setGameState(GAME_STATES.CAR_SELECTION);
  };

  const handleSettings = () => {
    initAudio();
    sfx.uiClick();
    setGameState(GAME_STATES.SETTINGS);
  };

  return (
    <div className="main-menu">
      <div className="main-menu__content">
        <p className="main-menu__eyebrow">Arcade Racer</p>
        <h1 className="main-menu__title">RACEFORGE</h1>
        <p className="main-menu__subtitle">
          Procedural tracks. Real physics feel. No two laps alike.
        </p>

        <div className="main-menu__actions">
          <Button variant="primary" onClick={handleStart} autoFocus>
            Race
          </Button>
          <Button variant="secondary" onClick={handleSettings}>
            Settings &amp; Controls
          </Button>
        </div>

        <dl className="main-menu__stats" aria-label="Career statistics">
          <div>
            <dt>Credits</dt>
            <dd>{progression.credits}</dd>
          </div>
          <div>
            <dt>Races</dt>
            <dd>{progression.totalRaces}</dd>
          </div>
          <div>
            <dt>Wins</dt>
            <dd>{progression.wins}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
