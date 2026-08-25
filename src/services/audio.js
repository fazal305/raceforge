/**
 * Procedural sound effects via the Web Audio API. No audio files, no
 * autoplay -- the AudioContext is only created after an explicit user
 * gesture (see init()), which browsers require anyway.
 */

let ctx = null;
let masterGain = null;
let engineOsc = null;
let engineGain = null;
let sfxEnabled = true;
let sfxVolume = 0.6;

function ensureContext() {
  if (ctx) return ctx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  ctx = new AudioContextClass();
  masterGain = ctx.createGain();
  masterGain.gain.value = sfxVolume;
  masterGain.connect(ctx.destination);
  return ctx;
}

export function initAudio() {
  const context = ensureContext();
  if (context && context.state === 'suspended') {
    context.resume();
  }
}

export function setSfxEnabled(enabled) {
  sfxEnabled = enabled;
}

export function setSfxVolume(volume) {
  sfxVolume = volume;
  if (masterGain) masterGain.gain.value = volume;
}

function playTone({ frequency, duration, type = 'sine', startGain = 0.35, sweepTo }) {
  if (!sfxEnabled) return;
  const context = ensureContext();
  if (!context) return;

  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, context.currentTime);
  if (sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(sweepTo, context.currentTime + duration);
  }
  gain.gain.setValueAtTime(startGain, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(context.currentTime + duration);
}

export const sfx = {
  countdownBeep: () => playTone({ frequency: 440, duration: 0.15, type: 'square' }),
  countdownGo: () => playTone({ frequency: 660, duration: 0.35, type: 'square', sweepTo: 880 }),
  checkpoint: () => playTone({ frequency: 880, duration: 0.12, type: 'triangle' }),
  lap: () => playTone({ frequency: 660, duration: 0.25, type: 'triangle', sweepTo: 990 }),
  collision: () => playTone({ frequency: 120, duration: 0.2, type: 'sawtooth', sweepTo: 60, startGain: 0.5 }),
  finish: () => playTone({ frequency: 523, duration: 0.6, type: 'square', sweepTo: 1046 }),
  uiClick: () => playTone({ frequency: 320, duration: 0.06, type: 'square', startGain: 0.2 }),
  uiSelect: () => playTone({ frequency: 520, duration: 0.08, type: 'sine', startGain: 0.25 }),
};

export function startEngineHum() {
  const context = ensureContext();
  if (!context || engineOsc) return;
  engineOsc = context.createOscillator();
  engineGain = context.createGain();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 60;
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain);
  engineGain.connect(masterGain);
  engineOsc.start();
}

export function updateEngineHum(throttle01) {
  if (!engineOsc || !sfxEnabled) return;
  const clamped = Math.max(0, Math.min(1, throttle01));
  engineOsc.frequency.setTargetAtTime(60 + clamped * 180, ctx.currentTime, 0.05);
  engineGain.gain.setTargetAtTime(clamped * 0.12, ctx.currentTime, 0.08);
}

export function stopEngineHum() {
  if (!engineOsc) return;
  try {
    engineOsc.stop();
  } catch {
    /* already stopped */
  }
  engineOsc.disconnect();
  engineGain.disconnect();
  engineOsc = null;
  engineGain = null;
}
