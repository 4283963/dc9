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
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
