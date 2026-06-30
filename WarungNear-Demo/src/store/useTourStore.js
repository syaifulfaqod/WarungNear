import { create } from 'zustand';

const useTourStore = create((set) => ({
  run: false,
  role: null,
  stepIndex: 0,
  setRun: (run) => set({ run }),
  setRole: (role) => set({ role }),
  setStepIndex: (stepIndex) => set({ stepIndex }),
  triggerTour: (role) => set({ run: true, role, stepIndex: 0 })
}));

export default useTourStore;
