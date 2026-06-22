export interface AgvStatus {
  id: string;
  timestamp: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  speed: number;
  battery: number;
  status: 'RUNNING' | 'IDLE' | 'CHARGING' | 'ERROR';
  hasContainer: boolean;
  containerColor: string;
  containerId: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface TrajectoryHistory {
  agvId: string;
  startTime: number;
  endTime: number;
  pointCount: number;
  totalArcLength: number;
  points: number[][];
  timestamps: number[];
  batterySeries: number[][];
}

export interface PlaybackState {
  mode: 'live' | 'playback';
  trajectory: TrajectoryHistory | null;
  playbackAgvId: string | null;
  progress: number;
  isPlaying: boolean;
  playbackSpeed: number;
  loading: boolean;
  error: string | null;
}
