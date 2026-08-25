/**
 * Every stat is normalized 0-1. None of the presets dominate: each trades
 * top speed / acceleration against handling and braking, so the "right"
 * car depends on the track, not on a single best pick.
 */
export const CARS = [
  {
    id: 'balanced',
    name: 'Meridian GT',
    tagline: 'No weakness, no edge.',
    color: '#f2792b',
    unlockedByDefault: true,
    stats: {
      acceleration: 0.6,
      topSpeed: 0.6,
      handling: 0.6,
      braking: 0.6,
      weight: 0.5,
    },
  },
  {
    id: 'speed',
    name: 'Vantail SR',
    tagline: 'Blistering on the straights, twitchy in the corners.',
    color: '#e5484d',
    unlockedByDefault: true,
    stats: {
      acceleration: 0.75,
      topSpeed: 0.9,
      handling: 0.35,
      braking: 0.45,
      weight: 0.65,
    },
  },
  {
    id: 'handling',
    name: 'Corner Wasp',
    tagline: 'Lives for the apex, gives up top end.',
    color: '#3ecf8e',
    unlockedByDefault: true,
    stats: {
      acceleration: 0.55,
      topSpeed: 0.45,
      handling: 0.9,
      braking: 0.75,
      weight: 0.3,
    },
  },
  {
    id: 'brawler',
    name: 'Ironclad HX',
    tagline: 'Heavy, brutal off the line, unlockable.',
    color: '#6fb7ff',
    unlockedByDefault: false,
    unlockCost: 1200,
    stats: {
      acceleration: 0.85,
      topSpeed: 0.55,
      handling: 0.4,
      braking: 0.5,
      weight: 0.9,
    },
  },
];

export function getCarById(id) {
  return CARS.find((car) => car.id === id) ?? CARS[0];
}
