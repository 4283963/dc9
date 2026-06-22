import { create } from 'zustand';
import { AgvStatus, ConnectionStatus } from '@/types/agv';

interface AgvState {
  vehicles: Map<string, AgvStatus>;
  connectionStatus: ConnectionStatus;
  lastUpdateTime: number;
  selectedVehicleId: string | null;
  setVehicle: (id: string, status: AgvStatus) => void;
  removeVehicle: (id: string) => void;
  setVehicles: (statuses: AgvStatus[]) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setSelectedVehicleId: (id: string | null) => void;
  clearAll: () => void;
}

export const useAgvStore = create<AgvState>((set) => ({
  vehicles: new Map(),
  connectionStatus: 'disconnected',
  lastUpdateTime: 0,
  selectedVehicleId: null,

  setVehicle: (id, status) =>
    set((state) => {
      const next = new Map(state.vehicles);
      next.set(id, status);
      return { vehicles: next, lastUpdateTime: Date.now() };
    }),

  removeVehicle: (id) =>
    set((state) => {
      const next = new Map(state.vehicles);
      next.delete(id);
      return { vehicles: next, lastUpdateTime: Date.now() };
    }),

  setVehicles: (statuses) =>
    set(() => {
      const next = new Map<string, AgvStatus>();
      statuses.forEach((s) => next.set(s.id, s));
      return { vehicles: next, lastUpdateTime: Date.now() };
    }),

  setConnectionStatus: (s) => set({ connectionStatus: s }),

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  clearAll: () =>
    set({ vehicles: new Map(), lastUpdateTime: 0, selectedVehicleId: null }),
}));
