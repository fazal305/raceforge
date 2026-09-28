import { formatTime, formatSpeed } from "../../utils/format.js";
import "./HUD.css";

export function HUD({ hud, onPause }) {
  if (!hud) return null;
  const checkpointProgress = hud.checkpointIndex / hud.totalCheckpoints;

  return (
    <div className="hud">
      <div className="hud__top">
        <div
          className="hud__lap"
          aria-label={`Lap ${hud.lap} of ${hud.totalLaps}`}
        >
          <span className="hud__lap-value">
            LAP {hud.lap}/{hud.totalLaps}
          </span>
          <div
            className="hud__checkpoint-track"
            role="progressbar"
            aria-valuenow={Math.round(checkpointProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="hud__checkpoint-fill"
              style={{ width: `${checkpointProgress * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className="hud__pause"
          onClick={onPause}
          aria-label="Pause race"
        >
          <span aria-hidden="true">II</span>
        </button>

        <div
          className="hud__position"
          aria-label={`Position ${hud.position} of ${hud.totalRacers}`}
        >
          <span className="hud__position-value">{hud.position}</span>
          <span className="hud__position-total">/{hud.totalRacers}</span>
        </div>
      </div>

      <div className="hud__bottom">
        <span className="hud__timer">{formatTime(hud.raceTime)}</span>
        <div className="hud__speed">
          <span className="hud__speed-value">{formatSpeed(hud.speed)}</span>
          <span className="hud__speed-unit">mph</span>
        </div>
      </div>
    </div>
  );
}
