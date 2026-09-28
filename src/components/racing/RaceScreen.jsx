import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore, GAME_STATES } from "../../state/store.js";
import { getTrackById } from "../../data/tracks.js";
import { getCarById } from "../../data/cars.js";
import { pickOpponents } from "../../data/opponents.js";
import { generateTrack } from "../../game/tracks/trackGenerator.js";
import { GameEngine } from "../../game/engine/GameEngine.js";
import { GameCanvas } from "./GameCanvas.jsx";
import { Countdown } from "./Countdown.jsx";
import { MobileControls } from "./MobileControls.jsx";
import { HUD } from "../hud/HUD.jsx";
import { PauseMenu } from "../hud/PauseMenu.jsx";
import { SettingsScreen } from "../settings/SettingsScreen.jsx";
import {
  initAudio,
  startEngineHum,
  stopEngineHum,
  updateEngineHum,
  sfx,
} from "../../services/audio.js";
import "./RaceScreen.css";

const COUNTDOWN_SEQUENCE = [3, 2, 1, "GO"];
const COUNTDOWN_STEP_MS = 800;

export function RaceScreen({ onExitToMenu }) {
  const selectedTrackId = useGameStore((s) => s.selectedTrackId);
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const setGameState = useGameStore((s) => s.setGameState);
  const setLastRaceResults = useGameStore((s) => s.setLastRaceResults);
  const recordRaceResult = useGameStore((s) => s.recordRaceResult);

  const track = useMemo(
    () => generateTrack(getTrackById(selectedTrackId)),
    [selectedTrackId],
  );
  const playerStats = useMemo(
    () => getCarById(selectedCarId).stats,
    [selectedCarId],
  );
  const opponentPresets = useMemo(() => {
    const base = getTrackById(selectedTrackId);
    return pickOpponents(3).map((preset) => ({
      ...preset,
      speedFactor: preset.speedFactor * (0.82 + base.aiDifficulty * 0.3),
    }));
  }, [selectedTrackId]);

  const engineRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const [phase, setPhase] = useState("countdown");
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SEQUENCE[0]);
  const [hud, setHud] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleFinish = useCallback(
    (results) => {
      setPhase("finished");
      sfx.finish();
      setTimeout(() => {
        const { creditsEarned, isPersonalBest } = recordRaceResult(
          track.id,
          results,
        );
        setLastRaceResults({ ...results, creditsEarned, isPersonalBest });
      }, 900);
    },
    [recordRaceResult, setLastRaceResults, track.id],
  );

  const handleEngineEvent = useCallback((type) => {
    if (type === "collision") sfx.collision();
    if (type === "checkpoint") sfx.checkpoint();
    if (type === "lap") sfx.lap();
  }, []);

  const handleHud = useCallback((snapshot) => {
    setHud(snapshot);
    updateEngineHum(snapshot.maxSpeed ? snapshot.speed / snapshot.maxSpeed : 0);
  }, []);

  const handleCanvasReady = useCallback(
    (canvas) => {
      initAudio();
      startEngineHum();

      const engine = new GameEngine({
        canvas,
        track,
        playerStats,
        opponents: opponentPresets,
        onHud: handleHud,
        onEvent: handleEngineEvent,
        onFinish: handleFinish,
      });
      engine.setFrozen(true);
      engine.setMinimapCanvas(minimapCanvasRef.current);
      engine.start();
      engineRef.current = engine;

      let i = 0;
      const runCountdown = () => {
        setCountdownValue(COUNTDOWN_SEQUENCE[i]);
        if (COUNTDOWN_SEQUENCE[i] === "GO") sfx.countdownGo();
        else sfx.countdownBeep();
        i += 1;
        if (i < COUNTDOWN_SEQUENCE.length) {
          setTimeout(runCountdown, COUNTDOWN_STEP_MS);
        } else {
          setTimeout(() => {
            setPhase("racing");
            engine.setFrozen(false);
            setGameState(GAME_STATES.RACING);
          }, COUNTDOWN_STEP_MS * 0.7);
        }
      };
      runCountdown();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(
    () => () => {
      engineRef.current?.destroy();
      stopEngineHum();
    },
    [],
  );

  const handlePause = useCallback(() => {
    if (phase !== "racing") return;
    setPhase("paused");
    engineRef.current?.setFrozen(true);
    setGameState(GAME_STATES.PAUSED);
  }, [phase, setGameState]);

  const handleResume = useCallback(() => {
    setPhase("racing");
    engineRef.current?.setFrozen(false);
    setGameState(GAME_STATES.RACING);
  }, [setGameState]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Escape" || event.code === "KeyP") {
        if (phase === "racing") handlePause();
        else if (phase === "paused") handleResume();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handlePause, handleResume]);

  const handleRestart = () => {
    engineRef.current?.destroy();
    stopEngineHum();
    onExitToMenu("restart");
  };

  const handleExit = () => {
    engineRef.current?.destroy();
    stopEngineHum();
    onExitToMenu("menu");
  };

  const handleTouchInput = useCallback((input) => {
    engineRef.current?.input.setTouchInput(input);
  }, []);

  return (
    <div className="race-screen">
      <GameCanvas onReady={handleCanvasReady} />
      <canvas
        ref={minimapCanvasRef}
        width={140}
        height={140}
        className="hud__minimap"
        style={{ visibility: phase === "countdown" ? "hidden" : "visible" }}
        aria-label="Track minimap"
        role="img"
      />

      {phase === "countdown" && <Countdown value={countdownValue} />}
      {phase !== "countdown" && <HUD hud={hud} onPause={handlePause} />}
      {phase === "paused" && !settingsOpen && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onSettings={() => setSettingsOpen(true)}
          onExit={handleExit}
        />
      )}
      {phase === "paused" && settingsOpen && (
        <div className="race-screen__settings-overlay">
          <SettingsScreen onBack={() => setSettingsOpen(false)} />
        </div>
      )}
      {phase === "finished" && (
        <div className="race-screen__finish" role="status">
          FINISH
        </div>
      )}
      {phase === "racing" && (
        <MobileControls onInputChange={handleTouchInput} />
      )}
    </div>
  );
}
