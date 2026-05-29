import { create } from 'zustand';

export type View = 'garage' | 'winners';

interface ViewState {
  currentView: View;
  setView: (view: View) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: 'garage',
  setView: (view) => set({ currentView: view }),
}));
