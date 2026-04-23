import { create } from 'zustand';
import type { LiveStatus } from '@hashtap/ui';

interface LiveState {
  status: LiveStatus;
  setStatus: (s: LiveStatus) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}));

export function useLiveStatus(): LiveStatus {
  return useLiveStore((s) => s.status);
}
