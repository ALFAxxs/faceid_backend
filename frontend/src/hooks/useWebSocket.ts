import { useEffect, useRef, useState, useCallback } from 'react';
import type { LiveEvent } from '@/types';

// Production'da VITE_WS_URL bo'sh -> joriy host'dan (wss/ws) avtomatik aniqlanadi.
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

interface Options {
  onEvent?: (event: LiveEvent) => void;
  enabled?: boolean;
}

/**
 * ws://localhost:8000/ws/events/ ga ulanadi.
 * Uzilsa 3 soniyadan keyin avtomatik qayta ulanadi.
 */
export function useWebSocket({ onEvent, enabled = true }: Options) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (wsRef.current) return;
    const ws = new WebSocket(`${WS_URL}/ws/events/`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'event.new' && msg.data) {
          onEventRef.current?.(msg.data as LiveEvent);
        }
      } catch {
        /* noto'g'ri payload — e'tiborsiz qoldiramiz */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // 3 soniyadan keyin qayta ulanish
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, connect]);

  return { connected };
}
