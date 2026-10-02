# RaceForge

A browser-based arcade racer built with React and Canvas 2D. Procedurally generated tracks, stat-driven cars, waypoint-following AI opponents, and a full menu → race → results loop, with progress saved locally.

**Live:** https://raceforge-game.netlify.app
**Repo:** https://github.com/fazal305/raceforge

## Features

- Procedurally generated closed-loop tracks (seeded, so a given track is always the same layout)
- Arcade physics: acceleration, braking, friction, speed-scaled steering, off-road slowdown
- Circle-based collision against obstacles, other cars, and off-road detection against the track's centerline
- Waypoint-following opponent AI with per-opponent speed/aggressiveness personalities
- Checkpoints, laps, race timer, live position, and a results/standings screen
- Four cars and three tracks, stat-driven, with a credits-based unlock system
- Local persistence of settings and career progress (best times, unlocks, credits, wins)
- Procedural sound effects via the Web Audio API (no audio files, no autoplay before user interaction)
- Keyboard controls (Arrow keys / WASD) and a dedicated touch control layer for mobile
- Pause/resume, restart, and an in-race settings overlay that doesn't lose your run
- Dark/light interface theme, reduced-motion support, and a loading state that skips flashing on fast operations

## Architecture

```
src/
├── components/       React UI: menus, HUD, results, settings, racing screen wrapper
├── game/              Game engine, entirely outside React
│   ├── engine/        GameEngine (the rAF loop) + race progress (checkpoints/laps)
│   ├── physics/       Car physics step
│   ├── collision/     Circle collision + off-road detection
│   ├── ai/             Opponent waypoint-following AI
│   ├── tracks/         Seeded procedural track generation
│   ├── rendering/      Canvas draw calls (track, cars, obstacles, minimap)
│   └── input/           Keyboard + touch input, merged into one intent object
├── state/              Zustand store (UI state, race config, settings, progression)
├── data/                Cars, tracks, opponent presets (data, not code)
├── services/            localStorage abstraction, Web Audio SFX
├── hooks/                Small reusable hooks (delayed loading flag)
└── utils/                Math, RNG, ranking, time/speed formatting
```

### React vs. game engine

React never renders a frame of gameplay. `GameEngine` (`src/game/engine/GameEngine.js`) owns the entire simulation — physics, AI, collisions, checkpoints — and draws directly to a `<canvas>` with `requestAnimationFrame`, using a fixed-timestep accumulator (1/60s steps) so the simulation is stable regardless of display refresh rate. It's a plain class with no React dependency, so it's testable and reusable on its own.

`RaceScreen` (`src/components/racing/RaceScreen.jsx`) is the only place React touches the engine: it creates/destroys a `GameEngine` instance tied to the component's lifecycle, and receives a **throttled** HUD snapshot (~12 times per second, via a callback) that it puts into `useState`. That's the one piece of race state that reaches React per frame-ish — everything else (car positions, AI state, collision resolution) lives in mutable objects inside the engine and is never touched by React's render cycle.

### Rendering

Canvas 2D, not SVG or DOM. The track, cars, obstacles, and skid marks are all drawn with `ctx` calls in `src/game/rendering/renderer.js`, keyed off a simple camera that follows the player (no camera rotation — a fixed top-down orientation kept the renderer and the mental model simple, and reads clearly on both desktop and mobile). A second, small canvas renders the minimap, updated on the same throttled cadence as the HUD rather than every frame.

### Physics

Deliberately simple arcade physics, not a simulation: throttle/brake apply constant acceleration, friction pulls speed back to zero, steering responsiveness scales with current speed (a stationary car barely turns), and going off-road both caps top speed and adds extra friction. Every car stat (acceleration, top speed, handling, braking, weight) is a 0–1 multiplier on these base constants — see `src/game/physics/physics.js`.

### Track generation

Each track in `src/data/tracks.js` is a seed plus shape parameters (radius, irregularity, control-point count), not authored geometry. `src/game/tracks/trackGenerator.js` scatters seeded random control points around a circle, threads a closed Catmull-Rom spline through them, and derives checkpoints, obstacle placement, and track bounds from the sampled centerline. The same seed always produces the same track.

### AI

Waypoint-following, not a planner: each opponent finds the nearest point on the track's centerline, steers toward a point further ahead on that line, throttles down for sharp upcoming turns, and nudges away from obstacles it's about to hit. Per-opponent `speedFactor` and `aggressiveness` (in `src/data/opponents.js`) create different racing personalities without different code paths.

### State (React side)

A single Zustand store (`src/state/store.js`), split conceptually into slices: UI/game-state enum, race configuration (selected car/track), settings, and progression. No router — the game is driven entirely by an explicit `gameState` enum (`MENU`, `CAR_SELECTION`, `TRACK_SELECTION`, `COUNTDOWN`, `RACING`, `PAUSED`, `RESULTS`, `SETTINGS`), switched on in `App.jsx`. Settings and progression are persisted via Zustand's `persist` middleware, backed by a small `storage.js` abstraction (versioned schema, safe-parse with fallback) rather than raw `localStorage` calls scattered through components.

### Performance

- Game state updates happen in plain JS objects inside `GameEngine`, not `useState` — nothing in the hot path triggers a React re-render.
- The HUD and minimap are updated on a throttled ~12Hz cadence, not every frame.
- `requestAnimationFrame`, event listeners, and Web Audio nodes are all cleaned up when `RaceScreen` unmounts (see the `destroy()` methods and effect cleanups).
- Skid mark particles are capped and decay/expire rather than accumulating indefinitely.
- No animation or UI-kit dependency — CSS transitions handle menu motion, canvas handles gameplay.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Steer | Arrow Left/Right or A/D | On-screen left/right buttons |
| Accelerate | Arrow Up or W | GAS button |
| Brake | Arrow Down or S | BRAKE button |
| Pause | Escape or P | Pause button in the HUD |

Full control reference is also in-app under **Settings & Controls**.

## Local persistence

Stored in `localStorage` under a `raceforge:` prefix, each value versioned so a future shape change can fall back cleanly instead of throwing:
- Settings (sound, volume, theme, reduced motion)
- Progression (credits, total races, wins, best lap/race times per track, unlocked cars/tracks)

Race configuration (selected car/track) and UI navigation state are intentionally **not** persisted — they reset to sensible defaults each session.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the Vitest suite
npm run build    # production build to dist/
npm run lint     # oxlint
```

No environment variables are required — RaceForge has no external API dependency (this was a deliberate choice; see "Known limitations" below).

## Testing

Unit tests cover the pieces where a bug would actually be hard to notice by playing: `npm run test`.

- **Physics** (`src/game/physics/physics.test.js`) — acceleration, max speed cap, friction decay, braking/reverse, speed-scaled steering, off-road speed cap
- **Collision** (`src/game/collision/collision.test.js`) — circle overlap, collision resolution/push-apart, off-road detection, obstacle hit detection
- **Race progress** (`src/game/engine/raceProgress.test.js`) — checkpoint advancement, lap completion, race finish, collision counting
- **Track generation** (`src/game/tracks/trackGenerator.test.js`) — determinism for a given seed, distinct layouts per seed, valid closed loops for every defined track
- **Ranking** (`src/utils/ranking.test.js`) — standings ordering for finished vs. still-racing entries
- **Storage** (`src/services/storage.test.js`) — round-tripping, fallback on corrupt/missing/stale data
- **Progression** (`src/state/store.test.js`) — credits awarded, unlock gating against affordability, best-time tracking, reset

`GameEngine` itself (the rAF loop / canvas orchestration) isn't unit tested — it's thin glue over the modules above, and its correctness was verified by manually driving `simulate()`/`render()` end-to-end through a full simulated race during development.

## Deployment

Static build deployed to Netlify.

```bash
npm run build
netlify deploy --dir=dist          # deploy
netlify deploy --prod --dir=dist   # promote straight to production, if your account allows it
```

`netlify.toml` in the project root sets the build command, publish directory, and an SPA redirect (`/* → /index.html`) so a direct link or a page refresh on any route still loads the app.

## Known limitations

- No online leaderboard or multiplayer — progress is local to the browser/device.
- Three tracks and four cars — enough to demonstrate the systems (procedural generation, stat-driven cars, unlocks), not a full content roster.
- AI opponents follow the racing line and react to nearby obstacles, but don't defend a position or draft — arcade-simple by design, not a full race-strategy simulation.
- No background music — only procedural sound effects. Adding music would mean either licensing a track or generating one procedurally, both out of scope here.
- Camera is a fixed top-down follow, no rotation or zoom.

## Future improvements

- More tracks and cars once the data-driven pattern is proven out
- Ghost/replay of a personal-best lap
- Drafting and rubber-banding for closer AI races
- A results-screen lap-time chart

## Tech stack

React 19, Vite, Zustand, Canvas 2D, Web Audio API, Vitest. No UI kit, no animation library, no external API — see the architecture notes above for why.
