import { create } from 'zustand';
import type { Car } from '../types/car';
import { GARAGE_PAGE_LIMIT } from '../constants/pagination';
import { RANDOM_CARS_COUNT } from '../constants/race';
import { generateRandomColor, generateRandomName } from '../utils/randomCar';
import * as garageApi from '../api/garage';

interface GarageState {
  cars: Car[];
  totalCount: number;
  currentPage: number;
  selectedCarId: number | null;
  isLoading: boolean;

  fetchCars: () => Promise<void>;
  setPage: (page: number) => void;
  createCar: (name: string, color: string) => Promise<void>;
  updateCar: (id: number, name: string, color: string) => Promise<void>;
  deleteCar: (id: number) => Promise<void>;
  generateRandomCars: () => Promise<void>;
  selectCar: (id: number) => void;
  deselectCar: () => void;
}

export const useGarageStore = create<GarageState>((set, get) => ({
  cars: [],
  totalCount: 0,
  currentPage: 1,
  selectedCarId: null,
  isLoading: false,

  fetchCars: async () => {
    set({ isLoading: true });
    const { currentPage } = get();
    const { data, totalCount } = await garageApi.getCars(currentPage, GARAGE_PAGE_LIMIT);
    set({ cars: data, totalCount, isLoading: false });
  },

  setPage: (page) => set({ currentPage: page }),

  createCar: async (name, color) => {
    await garageApi.createCar({ name, color });
    await get().fetchCars();
  },

  updateCar: async (id, name, color) => {
    await garageApi.updateCar(id, { name, color });
    set({ selectedCarId: null });
    await get().fetchCars();
  },

  deleteCar: async (id) => {
    await garageApi.deleteCar(id);
    const { currentPage, totalCount } = get();
    // If we deleted the last car on a page, step back a page.
    const isLastOnPage = totalCount - 1 <= (currentPage - 1) * GARAGE_PAGE_LIMIT;
    if (isLastOnPage && currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
    await get().fetchCars();
  },

  generateRandomCars: async () => {
    const requests = Array.from({ length: RANDOM_CARS_COUNT }, () =>
      garageApi.createCar({ name: generateRandomName(), color: generateRandomColor() }),
    );
    await Promise.all(requests);
    await get().fetchCars();
  },

  selectCar: (id) => set({ selectedCarId: id }),
  deselectCar: () => set({ selectedCarId: null }),
}));
