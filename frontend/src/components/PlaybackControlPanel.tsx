import { useState, useMemo, useCallback } from 'react';
import { Calendar, Play, Pause, RotateCcw, Search, Zap, Trash2, Clock, Map as MapIcon } from 'lucide-react';
import { usePlaybackStore } from '@/store/usePlaybackStore';

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const AGV_OPTIONS = Array.from({ length: 10 }, (_, i) =>
  `AGV-${String(i + 1).padStart(3, '0')}`
);

const SPEED_OPTIONS = [0.5, 1, 2, 4, 8, 16];

export function PlaybackControlPanel() {
  const {
    mode, trajectory, playbackAgvId, progress, isPlaying, playbackSpeed, loading, error,
    setLiveMode, setPlaybackMode, setTrajectory, setPlaybackAgvId, setProgress,
    setPlaying, togglePlaying, setPlaybackSpeed, setLoading, setError, clearPlayback,
  } = usePlaybackStore();

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const [dateStr, setDateStr] = useState(formatDate(yesterday));
  const [startTimeStr, setStartTimeStr] = useState('14:00');
  const [endTimeStr, setEndTimeStr] = useState('15:00');
  const [selectedAgv, setSelectedAgv] = useState('AGV-001');

  const buildTimestamp = useCallback((date: string, time: string): number => {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  }, []);

  const handleQuery = useCallback(async () => {
    const startTime = buildTimestamp(dateStr, startTimeStr);
    const endTime = buildTimestamp(dateStr, endTimeStr);
    if (startTime >= endTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8080/api/trajectory/history?agvId=${encodeURIComponent(selectedAgv)}&startTime=${startTime}&endTime=${endTime}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setTrajectory(data);
      setPlaybackAgvId(selectedAgv);
      setProgress(0);
      setPlaying(false);
      setPlaybackMode();
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败');
    } finally {
      setLoading(false);
    }
  }, [dateStr, startTimeStr, endTimeStr, selectedAgv, buildTimestamp,
      setLoading, setError, setTrajectory, setPlaybackAgvId, setProgress, setPlaying, setPlaybackMode]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(parseFloat(e.target.value) / 100);
  }, [setProgress]);

  const currentTimestamp = useMemo(() => {
    if (!trajectory) return 0;
    const t = trajectory.timestamps;
    const idx = Math.min(t.length - 1, Math.floor(progress * (t.length - 1)));
    return t[idx];
  }, [trajectory, progress]);

  const currentBattery = useMemo(() => {
    if (!trajectory) return 0;
    const b = trajectory.batterySeries;
    const idx = Math.min(b.length - 1, Math.floor(progress * (b.length - 1)));
    return b[idx][0];
  }, [trajectory, progress]);

  const currentArcPos = useMemo(() => {
    if (!trajectory) return 0;
    return trajectory.totalArcLength * progress;
  }, [trajectory, progress]);

  const isPanelOpen = mode === 'playback' || loading;

  return (
    <div className="absolute right-4 top-20 w-96 z-10 flex flex-col gap-2">
      <div
        onClick={() => {
          if (!isPanelOpen) setPlaybackMode();
        }}
        className={`
          flex items-center justify-between px-4 py-2.5 backdrop-blur-md border border-slate-700/50 rounded-t-lg cursor-pointer
          ${mode === 'playback' ? 'bg-slate-900/80 border-cyan-500/50' : 'bg-slate-900/60 hover:bg-slate-900/80'}
        `}
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold text-sm">历史轨迹回放</span>
          {mode === 'playback' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
              回放模式
            </span>
          )}
        </div>
        {mode === 'playback' && (
          <button
            onClick={(e) => { e.stopPropagation(); clearPlayback(); }}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
            title="退出回放"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {(isPanelOpen) && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-b-lg p-4 space-y-4 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                日期
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded bg-slate-800/80 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                车辆
              </label>
              <select
                value={selectedAgv}
                onChange={(e) => setSelectedAgv(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded bg-slate-800/80 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              >
                {AGV_OPTIONS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">开始时间</label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded bg-slate-800/80 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">结束时间</label>
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded bg-slate-800/80 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleQuery}
            disabled={loading}
            className="w-full py-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Search className="w-4 h-4 animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                查询轨迹并回放
              </>
            )}
          </button>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          {trajectory && (
            <>
              <div className="bg-slate-800/60 rounded p-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-500">数据点</span>
                  <span className="text-cyan-300 font-mono font-bold text-sm">{trajectory.pointCount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapIcon className="w-3 h-3" />总里程</span>
                  </span>
                  <span className="text-cyan-300 font-mono font-bold text-sm">{trajectory.totalArcLength.toFixed(1)} m</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-slate-500">当前时刻</span>
                  <span className="text-white font-mono text-sm">{formatDateTime(currentTimestamp)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">当前进度</span>
                  <span className="text-cyan-300 font-mono text-sm">{(progress * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">当前电量</span>
                  <span className={`font-mono text-sm ${currentBattery < 30 ? 'text-red-400' : 'text-green-400'}`}>
                    {currentBattery.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full transition-[width] duration-75"
                      style={{ width: `${progress * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-lg shadow-cyan-500/50 border-2 border-cyan-400 cursor-pointer transition"
                      style={{ left: `${progress * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress * 100}
                    onChange={handleProgressChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setProgress(0)}
                      className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="回到开始"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlaying}
                      className={`p-3 rounded-full transition shadow-lg
                        ${isPlaying
                          ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30'
                          : 'bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white shadow-cyan-500/40'
                        }`}
                      title={isPlaying ? '暂停' : '播放'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-800 rounded p-1">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`px-2 py-1 text-xs rounded font-mono transition
                          ${playbackSpeed === s
                            ? 'bg-cyan-500 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={setLiveMode}
                    className="px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition"
                  >
                    切回实时
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>{formatDateTime(trajectory.startTime)}</span>
                  <span>{formatDateTime(trajectory.endTime)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
