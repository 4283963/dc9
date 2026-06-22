import { useEffect, useRef, useCallback } from 'react';
import { AgvStatus } from '@/types/agv';
import { useAgvStore } from '@/store/useAgvStore';

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const reconnectTimerRef = useRef<number | null>(null);

  const setVehicles = useAgvStore((state) => state.setVehicles);
  const setConnectionStatus = useAgvStore((state) => state.setConnectionStatus);
  const clearAll = useAgvStore((state) => state.clearAll);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AgvStatus[];
          if (Array.isArray(data)) {
            setVehicles(data);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, setVehicles, setConnectionStatus]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    clearAll();
    setConnectionStatus('disconnected');
  }, [clearAll, setConnectionStatus]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect };
}
