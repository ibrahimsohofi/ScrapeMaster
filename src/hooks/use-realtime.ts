"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import type { WebSocketMessage } from '@/lib/websocket/server';

interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface RealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  connectionAttempts: number;
  error: string | null;
}

export function useRealtime(token?: string, options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    connectionAttempts: 0,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clear heartbeat interval
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          data: {},
          timestamp: Date.now(),
        }));
      }
    }, 30000); // Ping every 30 seconds
  }, [clearHeartbeat]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionAttempts: 0,
          error: null,
        }));

        clearReconnectTimeout();
        startHeartbeat();
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));

          // Handle pong responses
          if (message.type === 'pong') {
            return; // Don't trigger onMessage for pong
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        clearHeartbeat();
        onDisconnect?.();

        // Attempt to reconnect if not a clean close and we haven't exceeded attempts
        if (!event.wasClean && state.connectionAttempts < reconnectAttempts) {
          setState(prev => ({ ...prev, connectionAttempts: prev.connectionAttempts + 1 }));

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection failed',
          isConnecting: false,
        }));

        onError?.(error);
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false,
      }));
    }
  }, [token, state.connectionAttempts, reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage, clearReconnectTimeout, startHeartbeat, clearHeartbeat]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0,
    }));
  }, [clearReconnectTimeout, clearHeartbeat]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
      return true;
    }
    return false;
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  };
}

// Hook specifically for dashboard real-time updates
export function useDashboardRealtime(token?: string) {
  const [dashboardData, setDashboardData] = useState<{
    stats?: any;
    recentJobs?: any[];
    notifications?: any[];
  }>({});

  const { isConnected, sendMessage, ...realtimeState } = useRealtime(token, {
    onMessage: (message) => {
      switch (message.type) {
        case 'job_status':
          setDashboardData(prev => ({
            ...prev,
            recentJobs: [message.data, ...(prev.recentJobs?.slice(0, 9) || [])],
          }));
          break;

        case 'notification':
          setDashboardData(prev => ({
            ...prev,
            notifications: [message.data, ...(prev.notifications?.slice(0, 4) || [])],
          }));
          break;

        case 'analytics':
          setDashboardData(prev => ({
            ...prev,
            stats: { ...prev.stats, ...message.data },
          }));
          break;
      }
    },
  });

  // Subscribe to dashboard channels on connect
  useEffect(() => {
    if (isConnected) {
      // Subscribe to relevant channels
      sendMessage({
        type: 'ping',
        data: {},
      });
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    dashboardData,
    sendMessage,
    ...realtimeState,
  };
}

// Hook for scraper job progress updates
export function useScraperProgress(jobId?: string, token?: string) {
  const [progress, setProgress] = useState<{
    percentage: number;
    status: string;
    message?: string;
    error?: string;
  }>({ percentage: 0, status: 'idle' });

  const { isConnected, sendMessage } = useRealtime(token, {
    onMessage: (message) => {
      if (message.type === 'job_status' && message.data.jobId === jobId) {
        setProgress({
          percentage: message.data.progress || 0,
          status: message.data.status || 'unknown',
          message: message.data.message,
          error: message.data.error,
        });
      }
    },
  });

  return {
    isConnected,
    progress,
    sendMessage,
  };
}

// Hook for real-time notifications
export function useNotifications(token?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  const { isConnected, sendMessage } = useRealtime(token, {
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications(prev => [message.data, ...prev.slice(0, 9)]);
      }
    },
  });

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    markAsRead,
    clearAll,
    sendMessage,
  };
}
