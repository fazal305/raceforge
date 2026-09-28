import { useCallback, useRef } from "react";
import "./MobileControls.css";

/**
 * Touch-only control layer. Deliberately not a shrunken version of the
 * keyboard scheme -- large dedicated zones so thumbs never slip during a
 * turn. Hidden entirely on non-touch devices via CSS (pointer: coarse).
 */
export function MobileControls({ onInputChange }) {
  const stateRef = useRef({ steer: 0, throttle: 0, brake: 0 });

  const setAndPublish = useCallback(
    (key, value) => {
      stateRef.current = { ...stateRef.current, [key]: value };
      onInputChange(stateRef.current);
    },
    [onInputChange],
  );

  const handlePress = useCallback(
    (event, key, value) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      setAndPublish(key, value);
    },
    [setAndPublish],
  );

  const handleRelease = useCallback(
    (key) => {
      setAndPublish(key, 0);
    },
    [setAndPublish],
  );

  return (
    <div className="mobile-controls" aria-hidden="true">
      <div className="mobile-controls__steer">
        <button
          type="button"
          className="mobile-controls__btn"
          onPointerDown={(e) => handlePress(e, "steer", -1)}
          onPointerUp={() => handleRelease("steer")}
          onPointerCancel={() => handleRelease("steer")}
        >
          &#8592;
        </button>
        <button
          type="button"
          className="mobile-controls__btn"
          onPointerDown={(e) => handlePress(e, "steer", 1)}
          onPointerUp={() => handleRelease("steer")}
          onPointerCancel={() => handleRelease("steer")}
        >
          &#8594;
        </button>
      </div>
      <div className="mobile-controls__pedals">
        <button
          type="button"
          className="mobile-controls__btn mobile-controls__btn--brake"
          onPointerDown={(e) => handlePress(e, "brake", 1)}
          onPointerUp={() => handleRelease("brake")}
          onPointerCancel={() => handleRelease("brake")}
        >
          BRAKE
        </button>
        <button
          type="button"
          className="mobile-controls__btn mobile-controls__btn--throttle"
          onPointerDown={(e) => handlePress(e, "throttle", 1)}
          onPointerUp={() => handleRelease("throttle")}
          onPointerCancel={() => handleRelease("throttle")}
        >
          GAS
        </button>
      </div>
    </div>
  );
}
