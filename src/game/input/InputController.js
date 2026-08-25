const KEY_MAP = {
  ArrowUp: 'throttle',
  KeyW: 'throttle',
  ArrowDown: 'brake',
  KeyS: 'brake',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/**
 * Owns raw keyboard state and merges it with touch input from the mobile
 * control layer. Produces a single {throttle, brake, steer} intent object
 * consumed by the physics step -- the game loop never reads keyboard state
 * directly.
 */
export class InputController {
  constructor() {
    this.keys = { throttle: false, brake: false, left: false, right: false };
    this.touch = { throttle: 0, brake: 0, steer: 0 };
    this.touchActive = false;
    this.paused = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  handleKeyDown(event) {
    const action = KEY_MAP[event.code];
    if (!action) return;
    event.preventDefault();
    this.keys[action] = true;
  }

  handleKeyUp(event) {
    const action = KEY_MAP[event.code];
    if (!action) return;
    this.keys[action] = false;
  }

  handleBlur() {
    this.keys = { throttle: false, brake: false, left: false, right: false };
  }

  setTouchInput(partial) {
    this.touchActive = true;
    this.touch = { ...this.touch, ...partial };
  }

  clearTouchInput() {
    this.touch = { throttle: 0, brake: 0, steer: 0 };
  }

  getInput() {
    if (this.paused) return { throttle: 0, brake: 0, steer: 0 };

    const keyboardSteer = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const keyboardThrottle = this.keys.throttle ? 1 : 0;
    const keyboardBrake = this.keys.brake ? 1 : 0;

    return {
      throttle: Math.max(keyboardThrottle, this.touch.throttle),
      brake: Math.max(keyboardBrake, this.touch.brake),
      steer: keyboardSteer !== 0 ? keyboardSteer : this.touch.steer,
    };
  }

  setPaused(paused) {
    this.paused = paused;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }
}
