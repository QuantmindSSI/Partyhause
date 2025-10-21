import { create } from "zustand";

interface CoreAppState {
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
}

export const useCoreAppStore = create<CoreAppState>((set) => ({
  isHydrated: false,
  setHydrated: (value) => set({ isHydrated: value })
}));
