import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from './server';

export interface UseWebSocketOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  connectionCount: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    connectionCount: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // Clear timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    clearTimeouts();
    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, clearTimeouts]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setState(prev => ({
        ...prev,
        error: 'No authentication token available',
        connecting: false
      }));
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          connectionCount: prev.connectionCount + 1
        }));
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          setState(prev => ({
            ...prev,
            lastMessage: message
          }));

          // Call registered handlers for this message type
          const handlers = messageHandlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message.data);
              } catch (error) {
                console.error('Error in message handler:', error);
              }
            });
          }

          // Handle pong responses
          if (message.type === 'pong') {
            // Keep connection alive
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'Connection error',
          connecting: false
        }));
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        clearTimeouts();

        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setState(prev => ({
            ...prev,
            error: `Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setState(prev => ({
            ...prev,
            error: 'Max reconnection attempts reached'
          }));
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create connection',
        connecting: false
      }));
    }
  }, [enabled, getAuthToken, startHeartbeat, maxReconnectAttempts, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearTimeouts();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, [clearTimeouts]);

  // Send message
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
      return true;
    }
    return false;
  }, []);

  // Subscribe to message type
  const subscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    if (!messageHandlersRef.current.has(messageType)) {
      messageHandlersRef.current.set(messageType, new Set());
    }
    messageHandlersRef.current.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlersRef.current.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(messageType);
        }
      }
    };
  }, []);

  // Subscribe to job updates
  const subscribeToJobUpdates = useCallback((handler: (jobData: any) => void) => {
    return subscribe('job_status', handler);
  }, [subscribe]);

  // Subscribe to notifications
  const subscribeToNotifications = useCallback((handler: (notification: any) => void) => {
    return subscribe('notification', handler);
  }, [subscribe]);

  // Subscribe to analytics updates
  const subscribeToAnalytics = useCallback((handler: (analytics: any) => void) => {
    return subscribe('analytics', handler);
  }, [subscribe]);

  // Effect to handle connection
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimeouts]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    subscribeToJobUpdates,
    subscribeToNotifications,
    subscribeToAnalytics
  };
}

// Hook for job-specific updates
export function useJobUpdates(jobId?: string) {
  const [jobData, setJobData] = useState<any>(null);
  const { subscribeToJobUpdates, connected } = useWebSocket();

  useEffect(() => {
    if (!connected || !jobId) return;

    const unsubscribe = subscribeToJobUpdates((data: any) => {
      if (data.jobId === jobId) {
        setJobData(data);
      }
    });

    return unsubscribe;
  }, [subscribeToJobUpdates, connected, jobId]);

  return { jobData, connected };
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { subscribeToNotifications, connected } = useWebSocket();

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToNotifications((notification: any) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
    });

    return unsubscribe;
  }, [subscribeToNotifications, connected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotifications, connected };
}
