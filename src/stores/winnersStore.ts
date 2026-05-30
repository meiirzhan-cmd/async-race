import { create } from 'zustand';
import type { WinnerWithCar } from '../types/winner';
import type { SortOrder, WinnerSortField } from '../types/api';
import { WINNERS_PAGE_LIMIT } from '../constants/pagination';
import * as winnersApi from '../api/winners';
import { getCar } from '../api/garage';

interface WinnersState {
  winners: WinnerWithCar[];
  totalCount: number;
  currentPage: number;
  sortBy: WinnerSortField;
  sortOrder: SortOrder;
  isLoading: boolean;

  fetchWinners: () => Promise<void>;
  setPage: (page: number) => void;
  setSorting: (field: WinnerSortField) => void;
}

export const useWinnersStore = create<WinnersState>((set, get) => ({
  winners: [],
  totalCount: 0,
  currentPage: 1,
  sortBy: 'time',
  sortOrder: 'ASC',
  isLoading: false,

  fetchWinners: async () => {
    set({ isLoading: true });
    const { currentPage, sortBy, sortOrder } = get();
    const { data, totalCount } = await winnersApi.getWinners({
      page: currentPage,
      limit: WINNERS_PAGE_LIMIT,
      sort: sortBy,
      order: sortOrder,
    });
    // Fetch the car details for each winner to get name and color.
    const enriched = await Promise.all(
      data.map(async (winner) => {
        const car = await getCar(winner.id);
        return { ...winner, carName: car.name, carColor: car.color };
      }),
    );
    set({ winners: enriched, totalCount, isLoading: false });
  },

  setPage: (page) => set({ currentPage: page }),

  // Toggle ASC/DESC if same field, else switch to new field and reset to ASC.
  setSorting: (field) => {
    const { sortBy, sortOrder } = get();
    if (sortBy === field) {
      set({ sortOrder: sortOrder === 'ASC' ? 'DESC' : 'ASC' });
    } else {
      set({ sortBy: field, sortOrder: 'ASC' });
    }
  },
}));
