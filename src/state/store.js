import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage } from '../services/storage.js';
import { CARS } from '../data/cars.js';
import { TRACKS } from '../data/tracks.js';

export const GAME_STATES = {
  MENU: 'MENU',
  CAR_SELECTION: 'CAR_SELECTION',
  TRACK_SELECTION: 'TRACK_SELECTION',
  COUNTDOWN: 'COUNTDOWN',
  RACING: 'RACING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  RESULTS: 'RESULTS',
  SETTINGS: 'SETTINGS',
};

const zustandStorageAdapter = {
  getItem: (name) => storage.read(name, null),
  setItem: (name, value) => storage.write(name, value),
  removeItem: (name) => storage.remove(name),
};

const defaultUnlockedCars = CARS.filter((car) => car.unlockedByDefault).map((car) => car.id);
const defaultUnlockedTracks = TRACKS.filter((track) => track.unlockedByDefault).map((track) => track.id);

const initialProgression = {
  credits: 500,
  totalRaces: 0,
  wins: 0,
  bestLapTimesByTrack: {},
  bestRaceTimesByTrack: {},
  unlockedCarIds: defaultUnlockedCars,
  unlockedTrackIds: defaultUnlockedTracks,
};

const initialSettings = {
  soundEnabled: true,
  volume: 0.6,
  reducedMotion:
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  theme: 'dark',
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ---- ui slice (not persisted) ----
      gameState: GAME_STATES.MENU,
      lastRaceResults: null,
      setGameState: (gameState) => set({ gameState }),
      setLastRaceResults: (lastRaceResults) => set({ lastRaceResults, gameState: GAME_STATES.RESULTS }),

      // ---- race configuration (not persisted) ----
      selectedCarId: defaultUnlockedCars[0],
      selectedTrackId: defaultUnlockedTracks[0],
      setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
      setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),

      // ---- settings (persisted) ----
      settings: initialSettings,
      updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),

      // ---- progression (persisted) ----
      progression: initialProgression,

      recordRaceResult: (trackId, results) => {
        const prevBestRaceBefore = get().progression.bestRaceTimesByTrack[trackId];
        const isPersonalBest = prevBestRaceBefore === undefined || results.raceTime < prevBestRaceBefore;
        const isWin = results.playerPosition === 1;
        const creditsEarned = Math.round(200 / results.playerPosition) + (isWin ? 100 : 0);

        set((state) => {
          const prevBestLap = state.progression.bestLapTimesByTrack[trackId];
          const prevBestRace = state.progression.bestRaceTimesByTrack[trackId];

          return {
            progression: {
              ...state.progression,
              credits: state.progression.credits + creditsEarned,
              totalRaces: state.progression.totalRaces + 1,
              wins: state.progression.wins + (isWin ? 1 : 0),
              bestLapTimesByTrack: {
                ...state.progression.bestLapTimesByTrack,
                [trackId]:
                  results.bestLapTime !== null && (prevBestLap === undefined || results.bestLapTime < prevBestLap)
                    ? results.bestLapTime
                    : prevBestLap,
              },
              bestRaceTimesByTrack: {
                ...state.progression.bestRaceTimesByTrack,
                [trackId]:
                  prevBestRace === undefined || results.raceTime < prevBestRace ? results.raceTime : prevBestRace,
              },
            },
          };
        });
        return { creditsEarned, isPersonalBest };
      },

      unlockCar: (carId, cost) => {
        const state = get();
        if (state.progression.credits < cost || state.progression.unlockedCarIds.includes(carId)) return false;
        set({
          progression: {
            ...state.progression,
            credits: state.progression.credits - cost,
            unlockedCarIds: [...state.progression.unlockedCarIds, carId],
          },
        });
        return true;
      },

      unlockTrack: (trackId, cost) => {
        const state = get();
        if (state.progression.credits < cost || state.progression.unlockedTrackIds.includes(trackId)) return false;
        set({
          progression: {
            ...state.progression,
            credits: state.progression.credits - cost,
            unlockedTrackIds: [...state.progression.unlockedTrackIds, trackId],
          },
        });
        return true;
      },

      resetProgress: () =>
        set({
          progression: initialProgression,
          settings: initialSettings,
          selectedCarId: defaultUnlockedCars[0],
          selectedTrackId: defaultUnlockedTracks[0],
        }),
    }),
    {
      name: 'save',
      storage: zustandStorageAdapter,
      partialize: (state) => ({ settings: state.settings, progression: state.progression }),
    },
  ),
);
