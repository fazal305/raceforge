import { useEffect, useState } from "react";
import { useGameStore, GAME_STATES } from "./state/store.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MainMenu } from "./components/menu/MainMenu.jsx";
import { CarSelection } from "./components/menu/CarSelection.jsx";
import { TrackSelection } from "./components/menu/TrackSelection.jsx";
import { RaceScreen } from "./components/racing/RaceScreen.jsx";
import { ResultsScreen } from "./components/results/ResultsScreen.jsx";
import { SettingsScreen } from "./components/settings/SettingsScreen.jsx";

const RACE_STATES = new Set([
  GAME_STATES.COUNTDOWN,
  GAME_STATES.RACING,
  GAME_STATES.PAUSED,
]);

function Screen() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const [raceKey, setRaceKey] = useState(0);

  const handleExitFromRace = (reason) => {
    if (reason === "restart") {
      setRaceKey((key) => key + 1);
      setGameState(GAME_STATES.COUNTDOWN);
    } else {
      setGameState(GAME_STATES.MENU);
    }
  };

  if (RACE_STATES.has(gameState)) {
    return <RaceScreen key={raceKey} onExitToMenu={handleExitFromRace} />;
  }

  switch (gameState) {
    case GAME_STATES.CAR_SELECTION:
      return <CarSelection />;
    case GAME_STATES.TRACK_SELECTION:
      return <TrackSelection />;
    case GAME_STATES.RESULTS:
      return <ResultsScreen />;
    case GAME_STATES.SETTINGS:
      return <SettingsScreen />;
    case GAME_STATES.MENU:
    default:
      return <MainMenu />;
  }
}

function App() {
  const theme = useGameStore((s) => s.settings.theme);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const resetToMenu = useGameStore((s) => s.setGameState);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "force-reduced-motion",
      reducedMotion,
    );
  }, [reducedMotion]);

  return (
    <div className="app-shell">
      <ErrorBoundary onReset={() => resetToMenu(GAME_STATES.MENU)}>
        <Screen />
      </ErrorBoundary>
    </div>
  );
}

export default App;
