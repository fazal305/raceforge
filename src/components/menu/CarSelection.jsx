import { useState } from 'react';
import { useGameStore, GAME_STATES } from '../../state/store.js';
import { CARS } from '../../data/cars.js';
import { Button } from '../ui/Button.jsx';
import { StatBar } from '../ui/StatBar.jsx';
import { sfx } from '../../services/audio.js';
import './Selection.css';

export function CarSelection() {
  const setGameState = useGameStore((s) => s.setGameState);
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const setSelectedCarId = useGameStore((s) => s.setSelectedCarId);
  const unlockedCarIds = useGameStore((s) => s.progression.unlockedCarIds);
  const credits = useGameStore((s) => s.progression.credits);
  const unlockCar = useGameStore((s) => s.unlockCar);
  const [activeId, setActiveId] = useState(selectedCarId);

  const handlePick = (car) => {
    if (!unlockedCarIds.includes(car.id)) return;
    sfx.uiSelect();
    setActiveId(car.id);
  };

  const handleUnlock = (car) => {
    const unlocked = unlockCar(car.id, car.unlockCost);
    if (unlocked) sfx.checkpoint();
  };

  const handleContinue = () => {
    setSelectedCarId(activeId);
    sfx.uiSelect();
    setGameState(GAME_STATES.TRACK_SELECTION);
  };

  return (
    <div className="selection">
      <header className="selection__header">
        <p className="selection__eyebrow">Step 1 of 2</p>
        <h1 className="selection__title">Choose your car</h1>
        <p className="selection__credits">{credits} credits</p>
      </header>

      <div className="selection__grid" role="listbox" aria-label="Available cars">
        {CARS.map((car) => {
          const unlocked = unlockedCarIds.includes(car.id);
          const isActive = activeId === car.id;
          return (
            <div
              key={car.id}
              role="option"
              aria-selected={isActive}
              tabIndex={unlocked ? 0 : -1}
              className={`selection-card ${isActive ? 'selection-card--active' : ''} ${!unlocked ? 'selection-card--locked' : ''}`}
              onClick={() => handlePick(car)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePick(car)}
              style={{ '--card-accent': car.color }}
            >
              <div className="selection-card__swatch" />
              <h2 className="selection-card__name">{car.name}</h2>
              <p className="selection-card__tagline">{car.tagline}</p>
              <div className="selection-card__stats">
                <StatBar label="Accel" value={car.stats.acceleration} />
                <StatBar label="Top Speed" value={car.stats.topSpeed} />
                <StatBar label="Handling" value={car.stats.handling} />
                <StatBar label="Braking" value={car.stats.braking} />
              </div>
              {!unlocked && (
                <Button
                  variant="secondary"
                  className="selection-card__unlock"
                  disabled={credits < car.unlockCost}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlock(car);
                  }}
                >
                  Unlock &middot; {car.unlockCost}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <footer className="selection__footer">
        <Button variant="ghost" onClick={() => setGameState(GAME_STATES.MENU)}>
          Back
        </Button>
        <Button variant="primary" onClick={handleContinue}>
          Continue
        </Button>
      </footer>
    </div>
  );
}
