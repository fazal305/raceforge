import { stepCarPhysics, createInitialCarState } from '../physics/physics.js';
import { isOffRoad, checkObstacleCollisions, resolveCircleCollision, circlesOverlap } from '../collision/collision.js';
import { computeOpponentInput } from '../ai/opponentAI.js';
import { createRaceProgress, updateRaceProgress, recordCollision } from './raceProgress.js';
import { computeStandings } from '../../utils/ranking.js';
import { renderFrame, renderMinimap } from '../rendering/renderer.js';
import { InputController } from '../input/InputController.js';

const FIXED_STEP = 1 / 60;
const MAX_ACCUMULATED_STEPS = 5;
const HUD_UPDATE_INTERVAL = 1 / 12;
const CAR_COLLISION_RADIUS = 13;
const SKID_MAX_POINTS = 220;

/**
 * Owns the entire race simulation: physics, AI, collisions, checkpoints,
 * and rendering. Runs on requestAnimationFrame with a fixed-timestep
 * accumulator so physics stays stable regardless of display refresh rate.
 * Deliberately outside React -- see src/components/racing/RaceScreen.jsx
 * for the thin adapter that mounts/unmounts this and reads throttled
 * snapshots into HUD state.
 */
export class GameEngine {
  constructor({ canvas, track, playerStats, opponents, onHud, onEvent, onFinish }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.track = track;
    this.playerStats = playerStats;
    this.onHud = onHud;
    this.onEvent = onEvent ?? (() => {});
    this.onFinish = onFinish ?? (() => {});

    this.input = new InputController();

    this.player = {
      state: createInitialCarState(track.startPosition.x, track.startPosition.y, track.startHeading),
      progress: createRaceProgress(track.checkpoints.length, track.laps),
    };

    this.opponents = opponents.map((preset, index) => ({
      id: preset.id,
      name: preset.name,
      color: preset.color,
      preset,
      state: createInitialCarState(
        track.startPosition.x + (index + 1) * 22,
        track.startPosition.y + (index + 1) * 18,
        track.startHeading,
      ),
      progress: createRaceProgress(track.checkpoints.length, track.laps),
    }));

    this.skidMarks = [];
    this.raceTime = 0;
    this.running = false;
    this.frozen = false;
    this.accumulator = 0;
    this.hudAccumulator = 0;
    this.lastTimestamp = null;
    this.rafId = null;
    this.finished = false;
    this.minimapCanvas = null;

    this.tick = this.tick.bind(this);
  }

  setMinimapCanvas(canvas) {
    this.minimapCanvas = canvas;
  }

  start() {
    this.running = true;
    this.rafId = requestAnimationFrame(this.tick);
  }

  setFrozen(frozen) {
    this.frozen = frozen;
    this.input.setPaused(frozen);
  }

  tick(timestamp) {
    if (!this.running) return;
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (!this.frozen) {
      this.accumulator += Math.min(rawDelta, MAX_ACCUMULATED_STEPS * FIXED_STEP);
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < MAX_ACCUMULATED_STEPS) {
        this.simulate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
        steps += 1;
      }

      this.hudAccumulator += rawDelta;
      if (this.hudAccumulator >= HUD_UPDATE_INTERVAL) {
        this.hudAccumulator = 0;
        this.publishHud();
      }
    }

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  }

  simulate(dt) {
    this.raceTime += dt;
    this.simulatePlayer(dt);
    this.simulateOpponents(dt);
    this.resolveCarCollisions();
    this.decaySkidMarks(dt);

    if (!this.finished && this.player.progress.finished) {
      this.finished = true;
      this.onFinish(this.buildResults());
    }
  }

  simulatePlayer(dt) {
    const input = this.input.getInput();
    const offRoad = isOffRoad(this.track, this.player.state.x, this.player.state.y);
    const nextState = stepCarPhysics(this.player.state, input, this.playerStats, dt, offRoad);

    const hits = checkObstacleCollisions(this.track, nextState.x, nextState.y, CAR_COLLISION_RADIUS);
    if (hits.length > 0) {
      nextState.speed *= 0.4;
      this.player.progress = recordCollision(this.player.progress);
      this.onEvent('collision');
    }

    this.player.state = nextState;

    if (Math.abs(input.steer) > 0.5 && Math.abs(nextState.speed) > nextState.maxSpeed * 0.35) {
      this.pushSkidMark(nextState.x, nextState.y);
    }

    const result = updateRaceProgress(
      this.player.progress,
      nextState.x,
      nextState.y,
      this.track.checkpoints,
      this.raceTime,
    );
    this.player.progress = result.progress;
    if (result.checkpointHit) this.onEvent('checkpoint');
    if (result.lapCompleted) this.onEvent('lap');
  }

  simulateOpponents(dt) {
    this.opponents.forEach((opponent) => {
      if (opponent.progress.finished) return;
      const input = computeOpponentInput(opponent.state, this.track, opponent.preset);
      const offRoad = isOffRoad(this.track, opponent.state.x, opponent.state.y);
      const stats = {
        acceleration: 0.6,
        topSpeed: 0.6,
        handling: 0.6,
        braking: 0.6,
        weight: 0.5,
      };
      opponent.state = stepCarPhysics(opponent.state, input, stats, dt, offRoad);

      const result = updateRaceProgress(
        opponent.progress,
        opponent.state.x,
        opponent.state.y,
        this.track.checkpoints,
        this.raceTime,
      );
      opponent.progress = result.progress;
    });
  }

  resolveCarCollisions() {
    const bodies = [{ ref: this.player, state: this.player.state }, ...this.opponents.map((o) => ({ ref: o, state: o.state }))];
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const a = bodies[i].state;
        const b = bodies[j].state;
        if (!circlesOverlap(a.x, a.y, CAR_COLLISION_RADIUS, b.x, b.y, CAR_COLLISION_RADIUS)) continue;
        const resolution = resolveCircleCollision(a, b, CAR_COLLISION_RADIUS, CAR_COLLISION_RADIUS);
        if (!resolution.overlap) continue;
        a.x += resolution.pushA.x;
        a.y += resolution.pushA.y;
        b.x += resolution.pushB.x;
        b.y += resolution.pushB.y;
        a.speed *= 0.85;
        b.speed *= 0.85;
      }
    }
  }

  pushSkidMark(x, y) {
    this.skidMarks.push({ x, y, alpha: 0.4 });
    if (this.skidMarks.length > SKID_MAX_POINTS) this.skidMarks.shift();
  }

  decaySkidMarks(dt) {
    this.skidMarks.forEach((mark) => {
      mark.alpha = Math.max(0, mark.alpha - dt * 0.05);
    });
    this.skidMarks = this.skidMarks.filter((mark) => mark.alpha > 0);
  }

  publishHud() {
    const standings = computeStandings([
      { id: 'player', name: 'You', progress: this.player.progress },
      ...this.opponents.map((o) => ({ id: o.id, name: o.name, progress: o.progress })),
    ]);
    const playerStanding = standings.find((s) => s.id === 'player');

    this.onHud({
      speed: Math.abs(this.player.state.speed),
      maxSpeed: this.player.state.maxSpeed,
      lap: Math.min(this.player.progress.lapsCompleted + 1, this.track.laps),
      totalLaps: this.track.laps,
      position: playerStanding?.position ?? this.opponents.length + 1,
      totalRacers: this.opponents.length + 1,
      raceTime: this.raceTime,
      checkpointIndex: this.player.progress.nextCheckpointIndex,
      totalCheckpoints: this.track.checkpoints.length,
    });

    if (this.minimapCanvas) {
      const ctx = this.minimapCanvas.getContext('2d');
      renderMinimap(ctx, this.minimapCanvas.width, this.track, this.player.state, this.opponents);
    }
  }

  buildResults() {
    const standings = computeStandings([
      { id: 'player', name: 'You', progress: this.player.progress },
      ...this.opponents.map((o) => ({ id: o.id, name: o.name, progress: o.progress })),
    ]);
    return {
      standings,
      playerPosition: standings.find((s) => s.id === 'player')?.position ?? null,
      raceTime: this.raceTime,
      lapTimes: this.player.progress.lapTimes,
      bestLapTime: this.player.progress.bestLapTime,
      collisions: this.player.progress.collisions,
    };
  }

  render() {
    // clientWidth/Height, not canvas.width/height: the canvas backing
    // store is scaled by devicePixelRatio and the context already carries
    // that scale transform (see GameCanvas), so drawing math stays in CSS
    // pixel space.
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    renderFrame(this.ctx, width, height, {
      track: this.track,
      player: this.player.state,
      playerProgress: this.player.progress,
      opponents: this.opponents,
      skidMarks: this.skidMarks,
    });
  }

  destroy() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.input.destroy();
  }
}
