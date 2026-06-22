import { useMemo, useState } from 'react';
import { Battery, Zap, Clock, MapPin, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgvStore } from '@/store/useAgvStore';
import { AgvStatus } from '@/types/agv';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  RUNNING: { label: '运行中', color: 'text-green-400', bg: 'bg-green-500/20' },
  IDLE: { label: '空闲', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  CHARGING: { label: '充电中', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  ERROR: { label: '故障', color: 'text-red-400', bg: 'bg-red-500/20' },
};

function AgvCard({ vehicle, isSelected, onClick }: {
  vehicle: AgvStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[vehicle.status] || statusConfig.IDLE;
  const batteryColor = vehicle.battery < 20 ? 'bg-red-500' : vehicle.battery < 50 ? 'bg-yellow-500' : 'bg-cyan-400';

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border transition-all duration-200 cursor-pointer
        backdrop-blur-md hover:scale-[1.02]
        ${isSelected
          ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/30'
          : 'bg-slate-900/60 border-slate-700/50 hover:border-cyan-500/50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse`} />
          <span className="font-mono text-sm font-bold text-white">{vehicle.id}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">速度</span>
          <span className="font-mono text-white ml-auto">{vehicle.speed.toFixed(2)} m/s</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">电量</span>
            <span className="font-mono text-white ml-auto">{vehicle.battery.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${batteryColor}`}
              style={{ width: `${vehicle.battery}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">坐标</span>
          <span className="font-mono text-slate-300 ml-auto text-[10px]">
            {vehicle.position.x.toFixed(1)}, {vehicle.position.z.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatusPanel() {
  const vehicles = useAgvStore((state) => state.vehicles);
  const selectedVehicleId = useAgvStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useAgvStore((state) => state.setSelectedVehicleId);
  const connectionStatus = useAgvStore((state) => state.connectionStatus);
  const lastUpdateTime = useAgvStore((state) => state.lastUpdateTime);
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedVehicles = useMemo(() => {
    return Array.from(vehicles.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [vehicles]);

  const stats = useMemo(() => {
    const list = Array.from(vehicles.values());
    const running = list.filter(v => v.status === 'RUNNING').length;
    const charging = list.filter(v => v.status === 'CHARGING').length;
    const error = list.filter(v => v.status === 'ERROR').length;
    const avgSpeed = list.length > 0
      ? list.reduce((sum, v) => sum + v.speed, 0) / list.length
      : 0;
    const avgBattery = list.length > 0
      ? list.reduce((sum, v) => sum + v.battery, 0) / list.length
      : 0;
    return { total: list.length, running, charging, error, avgSpeed, avgBattery };
  }, [vehicles]);

  const connectionColor = connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500';
  const connectionLabel = connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '已断开';

  return (
    <div className="absolute left-4 top-20 bottom-4 w-80 flex flex-col z-10">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-t-lg cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold text-sm">AGV 车辆监控</span>
          <div className={`w-2 h-2 rounded-full ${connectionColor} animate-pulse`} />
          <span className="text-xs text-slate-400">{connectionLabel}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </div>

      {isExpanded && (
        <>
          <div className="bg-slate-900/60 backdrop-blur-md border-x border-slate-700/50 px-4 py-3 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.total}</div>
              <div className="text-xs text-slate-400">在线车辆</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 font-mono">{stats.running}</div>
              <div className="text-xs text-slate-400">运行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.charging}</div>
              <div className="text-xs text-slate-400">充电中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 font-mono">{stats.error}</div>
              <div className="text-xs text-slate-400">故障</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border-x border-slate-700/50 px-4 py-2 flex justify-between text-xs border-t border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">平均速度</span>
              <span className="font-mono text-white">{stats.avgSpeed.toFixed(2)} m/s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">平均电量</span>
              <span className="font-mono text-white">{stats.avgBattery.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/60 backdrop-blur-md border-x border-b border-slate-700/50 rounded-b-lg overflow-hidden">
            <div className="p-2 space-y-2 overflow-y-auto h-full">
              {sortedVehicles.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  等待车辆数据...
                </div>
              ) : (
                sortedVehicles.map((vehicle) => (
                  <AgvCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedVehicleId === vehicle.id}
                    onClick={() => setSelectedVehicleId(selectedVehicleId === vehicle.id ? null : vehicle.id)}
                  />
                ))
              )}
            </div>
          </div>

          {lastUpdateTime > 0 && (
            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>最后更新: {new Date(lastUpdateTime).toLocaleTimeString()}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
