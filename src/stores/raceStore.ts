import { create } from 'zustand';
import type { Car } from '../types/car';
import { startEngine, stopEngine, driveMode } from '../api/engine';
import { saveWinner } from '../api/winners';
import { calculateDuration } from '../utils/calculateDuration';
import { TRACK_END_PERCENT } from '../constants/race';

type EngineState = 'idle' | 'starting' | 'driving' | 'finished' | 'broken';

export interface CarRaceStatus {
  engineState: EngineState;
  velocity: number;
  distance: number;
  animationDuration: number;
  positionPercent: number;
  useTransition: boolean;
  finishTime: number;
}

// Non-serializable state lives outside the store.
const carAbortControllers = new Map<number, AbortController>();
const carStartTimes = new Map<number, number>();

const initialStatus: CarRaceStatus = {
  engineState: 'idle',
  velocity: 0,
  distance: 0,
  animationDuration: 0,
  positionPercent: 0,
  useTransition: false,
  finishTime: 0,
};

interface WinnerInfo {
  id: number;
  name: string;
  color: string;
  time: number;
}

interface RaceState {
  carStatuses: Record<number, CarRaceStatus>;
  isRaceActive: boolean;
  raceWinner: WinnerInfo | null;
  showWinnerBanner: boolean;

  getCarStatus: (id: number) => CarRaceStatus;
  startSingleCar: (id: number) => Promise<void>;
  stopSingleCar: (id: number) => Promise<void>;
  startRace: (cars: Car[]) => Promise<void>;
  resetRace: (cars: Car[]) => Promise<void>;
  dismissWinnerBanner: () => void;
}

export const useRaceStore = create<RaceState>((set, get) => {
  // Helper to update a single car's status.
  const updateStatus = (id: number, patch: Partial<CarRaceStatus>): void => {
    set((state) => ({
      carStatuses: {
        ...state.carStatuses,
        [id]: { ...(state.carStatuses[id] ?? initialStatus), ...patch },
      },
    }));
  };

  // Start engine + animate one car. Resolves with the finish time on success,
  // or null if the engine broke.
  const driveCar = async (id: number): Promise<number | null> => {
    updateStatus(id, { engineState: 'starting' });
    const { velocity, distance } = await startEngine(id);
    const duration = calculateDuration(distance, velocity);

    updateStatus(id, {
      engineState: 'driving',
      velocity,
      distance,
      animationDuration: duration,
      positionPercent: TRACK_END_PERCENT,
      useTransition: true,
    });
    carStartTimes.set(id, performance.now());

    const controller = new AbortController();
    carAbortControllers.set(id, controller);

    const response = await driveMode(id, controller.signal);
    carAbortControllers.delete(id);

    if (response.success) {
      updateStatus(id, { engineState: 'finished', finishTime: duration });
      return duration;
    }
    // Engine broke: freeze the car where it currently is on screen.
    const elapsed = (performance.now() - (carStartTimes.get(id) ?? 0)) / 1000;
    const frozen = TRACK_END_PERCENT * Math.min(elapsed / duration, 1);
    updateStatus(id, {
      engineState: 'broken',
      positionPercent: frozen,
      useTransition: false,
    });
    return null;
  };

  return {
    carStatuses: {},
    isRaceActive: false,
    raceWinner: null,
    showWinnerBanner: false,

    getCarStatus: (id) => get().carStatuses[id] ?? initialStatus,

    startSingleCar: async (id) => {
      await driveCar(id);
    },

    stopSingleCar: async (id) => {
      carAbortControllers.get(id)?.abort();
      await stopEngine(id).catch(() => {});
      updateStatus(id, { ...initialStatus });
    },

    startRace: async (cars) => {
      set({ isRaceActive: true, raceWinner: null, showWinnerBanner: false });
      let winnerRecorded = false;

      const promises = cars.map(async (car) => {
        const time = await driveCar(car.id);
        if (time !== null && !winnerRecorded) {
          winnerRecorded = true;
          set({
            raceWinner: { id: car.id, name: car.name, color: car.color, time },
            showWinnerBanner: true,
          });
          await saveWinner(car.id, time);
        }
      });

      await Promise.allSettled(promises);
      set({ isRaceActive: false });
    },

    resetRace: async (cars) => {
      // Abort every in-flight drive request.
      cars.forEach((car) => carAbortControllers.get(car.id)?.abort());
      carAbortControllers.clear();
      await Promise.allSettled(cars.map((car) => stopEngine(car.id)));
      const reset = Object.fromEntries(cars.map((car) => [car.id, { ...initialStatus }]));
      set({
        carStatuses: reset,
        isRaceActive: false,
        raceWinner: null,
        showWinnerBanner: false,
      });
    },

    dismissWinnerBanner: () => set({ showWinnerBanner: false }),
  };
});
