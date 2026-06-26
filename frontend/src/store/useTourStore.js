import { create } from 'zustand';

const useTourStore = create((set) => ({
  run: false,
  setRun: (run) => set({ run }),
  triggerTour: () => set({ run: true })
}));

export default useTourStore;
