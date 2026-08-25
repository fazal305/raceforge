import { clamp } from '../../utils/math.js';

export const PHYSICS_CONSTANTS = {
  BASE_MAX_SPEED: 260, // px/s
  BASE_ACCEL: 220, // px/s^2
  BASE_BRAKE: 340, // px/s^2
  BASE_FRICTION: 0.9, // 1/s, natural decel
  BASE_TURN_RATE: 2.6, // rad/s at full speed
  REVERSE_SPEED_FACTOR: 0.35,
  OFF_ROAD_SPEED_FACTOR: 0.45,
  OFF_ROAD_FRICTION_BONUS: 1.8,
  MIN_TURN_SPEED_FACTOR: 0.25,
};

/**
 * One fixed-timestep physics update for a single car. Pure function: takes
 * the current state and returns a new state object, so it can be unit
 * tested without any engine/rendering dependency.
 */
export function stepCarPhysics(state, input, stats, dt, offRoad = false) {
  const {
    BASE_MAX_SPEED,
    BASE_ACCEL,
    BASE_BRAKE,
    BASE_FRICTION,
    BASE_TURN_RATE,
    REVERSE_SPEED_FACTOR,
    OFF_ROAD_SPEED_FACTOR,
    OFF_ROAD_FRICTION_BONUS,
    MIN_TURN_SPEED_FACTOR,
  } = PHYSICS_CONSTANTS;

  const throttle = clamp(input.throttle ?? 0, 0, 1);
  const brake = clamp(input.brake ?? 0, 0, 1);
  const steer = clamp(input.steer ?? 0, -1, 1);

  const maxSpeed = BASE_MAX_SPEED * (0.55 + stats.topSpeed * 0.75) * (offRoad ? OFF_ROAD_SPEED_FACTOR : 1);
  const accelRate = BASE_ACCEL * (0.5 + stats.acceleration * 0.9);
  const brakeRate = BASE_BRAKE * (0.5 + stats.braking * 0.9);
  const frictionCoef = BASE_FRICTION * (1 + stats.weight * 0.25) + (offRoad ? OFF_ROAD_FRICTION_BONUS : 0);
  const turnRate = BASE_TURN_RATE * (0.55 + stats.handling * 0.75);

  let { speed, heading, x, y } = state;

  if (throttle > 0) {
    speed += accelRate * throttle * dt;
  }
  if (brake > 0) {
    speed -= brakeRate * brake * dt;
  }
  // Natural friction always pulls speed toward zero.
  speed -= speed * frictionCoef * dt;

  const minSpeed = -maxSpeed * REVERSE_SPEED_FACTOR;
  speed = clamp(speed, minSpeed, maxSpeed);

  // Steering responsiveness scales with speed: near-stationary cars barely turn.
  const speedFactor = clamp(Math.abs(speed) / maxSpeed, MIN_TURN_SPEED_FACTOR, 1);
  const direction = speed >= 0 ? 1 : -1;
  heading += steer * turnRate * speedFactor * direction * dt;

  x += Math.cos(heading) * speed * dt;
  y += Math.sin(heading) * speed * dt;

  return { x, y, heading, speed, maxSpeed };
}

export function createInitialCarState(x, y, heading) {
  return { x, y, heading, speed: 0, maxSpeed: PHYSICS_CONSTANTS.BASE_MAX_SPEED };
}
