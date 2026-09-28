import { useState } from "react";
import { useGameStore, GAME_STATES } from "../../state/store.js";
import { Button } from "../ui/Button.jsx";
import { setSfxEnabled, setSfxVolume, sfx } from "../../services/audio.js";
import "./SettingsScreen.css";

export function SettingsScreen({ onBack }) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const setGameState = useGameStore((s) => s.setGameState);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const handleBack = onBack ?? (() => setGameState(GAME_STATES.MENU));

  const handleSoundToggle = () => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    setSfxEnabled(next);
    if (next) sfx.uiClick();
  };

  const handleVolumeChange = (event) => {
    const volume = Number(event.target.value);
    updateSettings({ volume });
    setSfxVolume(volume);
  };

  const handleThemeToggle = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
    sfx.uiClick();
  };

  const handleReducedMotionToggle = () => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  };

  const handleResetClick = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetProgress();
    setConfirmingReset(false);
  };

  return (
    <div className="settings">
      <header className="settings__header">
        <h1 className="settings__title">Settings</h1>
        <Button variant="ghost" onClick={handleBack}>
          Back
        </Button>
      </header>

      <section className="settings__section">
        <h2 className="settings__section-title">Audio</h2>
        <label className="settings__row">
          <span>Sound effects</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={handleSoundToggle}
          />
        </label>
        <label className="settings__row">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={handleVolumeChange}
            disabled={!settings.soundEnabled}
            aria-label="Sound effects volume"
          />
        </label>
      </section>

      <section className="settings__section">
        <h2 className="settings__section-title">Display</h2>
        <label className="settings__row">
          <span>Interface theme</span>
          <Button variant="secondary" onClick={handleThemeToggle}>
            {settings.theme === "dark" ? "Dark" : "Light"}
          </Button>
        </label>
        <label className="settings__row">
          <span>Reduce motion</span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={handleReducedMotionToggle}
          />
        </label>
      </section>

      <section className="settings__section">
        <h2 className="settings__section-title">Controls</h2>
        <div className="settings__controls-grid">
          <div>
            <strong>Steer</strong>
            <span>Arrow Left/Right or A/D</span>
          </div>
          <div>
            <strong>Accelerate</strong>
            <span>Arrow Up or W</span>
          </div>
          <div>
            <strong>Brake</strong>
            <span>Arrow Down or S</span>
          </div>
          <div>
            <strong>Pause</strong>
            <span>Escape or P</span>
          </div>
          <div>
            <strong>Mobile</strong>
            <span>
              On-screen steer and pedal buttons appear automatically on touch
              devices
            </span>
          </div>
        </div>
      </section>

      <section className="settings__section">
        <h2 className="settings__section-title">Data</h2>
        <div className="settings__row">
          <span>Reset all progress</span>
          <Button variant="danger" onClick={handleResetClick}>
            {confirmingReset ? "Confirm reset" : "Reset"}
          </Button>
        </div>
      </section>
    </div>
  );
}
