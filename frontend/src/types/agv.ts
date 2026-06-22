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
