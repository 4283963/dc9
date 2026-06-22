import { Scene3D } from '@/components/Scene3D';
import { TopBar } from '@/components/TopBar';
import { StatusPanel } from '@/components/StatusPanel';
import { PlaybackControlPanel } from '@/components/PlaybackControlPanel';
import { useWebSocket } from '@/hooks/useWebSocket';

const WS_URL = 'ws://localhost:8080/ws/agv';

export default function Home() {
  useWebSocket({ url: WS_URL });

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
      <div className="absolute inset-0">
        <Scene3D />
      </div>

      <TopBar />
      <StatusPanel />
      <PlaybackControlPanel />

      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.015) 0px, rgba(0,229,255,0.015) 1px, transparent 1px, transparent 4px)',
        }}
      />
    </div>
  );
}