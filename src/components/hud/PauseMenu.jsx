import { Button } from '../ui/Button.jsx';
import './PauseMenu.css';

export function PauseMenu({ onResume, onRestart, onSettings, onExit }) {
  return (
    <div className="pause-menu" role="dialog" aria-modal="true" aria-label="Race paused">
      <div className="pause-menu__panel">
        <h2 className="pause-menu__title">Paused</h2>
        <div className="pause-menu__actions">
          <Button variant="primary" onClick={onResume} autoFocus>
            Resume
          </Button>
          <Button variant="secondary" onClick={onRestart}>
            Restart Race
          </Button>
          <Button variant="secondary" onClick={onSettings}>
            Settings
          </Button>
          <Button variant="danger" onClick={onExit}>
            Exit Race
          </Button>
        </div>
      </div>
    </div>
  );
}
