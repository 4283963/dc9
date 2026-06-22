import { create } from 'zustand';
import { TrajectoryHistory } from '@/types/agv';

interface PlaybackStore {
  mode: 'live' | 'playback';
  trajectory: TrajectoryHistory | null;
  playbackAgvId: string | null;
  progress: number;
  isPlaying: boolean;
  playbackSpeed: number;
  loading: boolean;
  error: string | null;

  setLiveMode: () => void;
  setPlaybackMode: () => void;
  setTrajectory: (t: TrajectoryHistory | null) => void;
  setPlaybackAgvId: (id: string | null) => void;
  setProgress: (p: number) => void;
  setPlaying: (p: boolean) => void;
  togglePlaying: () => void;
  setPlaybackSpeed: (s: number) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
  clearPlayback: () => void;
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  mode: 'live',
  trajectory: null,
  playbackAgvId: null,
  progress: 0,
  isPlaying: false,
  playbackSpeed: 1,
  loading: false,
  error: null,

  setLiveMode: () => set({ mode: 'live', isPlaying: false }),
  setPlaybackMode: () => set({ mode: 'playback' }),
  setTrajectory: (t) => set({ trajectory: t }),
  setPlaybackAgvId: (id) => set({ playbackAgvId: id }),
  setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),
  setPlaying: (p) => set({ isPlaying: p }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
  setLoading: (l) => set({ loading: l }),
  setError: (e) => set({ error: e }),
  clearPlayback: () => set({
    mode: 'live',
    trajectory: null,
    playbackAgvId: null,
    progress: 0,
    isPlaying: false,
    loading: false,
    error: null,
  }),
}));
