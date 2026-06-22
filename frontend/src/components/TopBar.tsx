import { useState, useEffect } from 'react';
import { Radio, Activity, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAgvStore } from '@/store/useAgvStore';

export function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const connectionStatus = useAgvStore((state) => state.connectionStatus);
  const vehicles = useAgvStore((state) => state.vehicles);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusConfig = {
    connected: { icon: Wifi, color: 'text-green-400', bg: 'bg-green-500/20', label: '数据实时同步' },
    connecting: { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '正在连接...' },
    disconnected: { icon: WifiOff, color: 'text-red-400', bg: 'bg-red-500/20', label: '连接断开' },
  };

  const config = statusConfig[connectionStatus];
  const StatusIcon = config.icon;

  return (
    <div className="absolute top-0 left-0 right-0 z-20">
      <div className="relative h-16 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-transparent">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide" style={{ fontFamily: "'Orbitron', 'Space Grotesk', sans-serif" }}>
                  集装箱码头数字孪生
                </h1>
                <div className="text-xs text-slate-400 tracking-widest">PORT DIGITAL TWIN</div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700/50 mx-2" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 backdrop-blur border border-slate-700/50">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300">在线车辆</span>
              <span className="font-mono text-lg font-bold text-cyan-400">{vehicles.size}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} backdrop-blur border border-current/20 ${config.color}`}>
              <StatusIcon className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>

            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-white tracking-wider">
                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
              <div className="text-xs text-slate-400">
                {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
