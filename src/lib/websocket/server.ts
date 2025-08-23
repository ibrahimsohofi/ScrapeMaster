import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/auth/jwt';
import type { IncomingMessage } from 'http';

export interface WebSocketMessage {
  type: 'job_status' | 'notification' | 'analytics' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: number;
  userId?: string;
  organizationId?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  organizationId?: string;
  role?: string;
  lastPing?: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  public initialize(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('WebSocket server initialized');
  }

  private async verifyClient(info: { req: IncomingMessage }): Promise<boolean> {
    try {
      const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        return false;
      }

      const payload = await verifyToken(token);
      return !!payload;
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      const payload = await verifyToken(token);
      if (!payload) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Set user context
      ws.userId = payload.userId;
      ws.organizationId = payload.organizationId;
      ws.role = payload.role;
      ws.lastPing = Date.now();

      // Add to clients map (only if organizationId is defined)
      if (payload.organizationId) {
        const organizationClients = this.clients.get(payload.organizationId) || new Set();
        organizationClients.add(ws);
        this.clients.set(payload.organizationId, organizationClients);
      }

      console.log(`WebSocket client connected: ${payload.userId} (${payload.organizationId})`);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'notification',
        data: { message: 'Connected to DataVault Pro real-time updates', level: 'info' },
        timestamp: Date.now()
      });

      // Handle messages
      ws.on('message', (data) => this.handleMessage(ws, data));

      // Handle disconnection
      ws.on('close', () => this.handleDisconnection(ws));

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          ws.lastPing = Date.now();
          this.sendToClient(ws, {
            type: 'pong',
            data: {},
            timestamp: Date.now()
          });
          break;

        default:
          console.log('Received message:', message.type, message.data);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.organizationId) {
      const organizationClients = this.clients.get(ws.organizationId);
      if (organizationClients) {
        organizationClients.delete(ws);
        if (organizationClients.size === 0) {
          this.clients.delete(ws.organizationId);
        }
      }
      console.log(`WebSocket client disconnected: ${ws.userId} (${ws.organizationId})`);
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Public methods for sending updates

  public broadcastJobUpdate(organizationId: string, jobData: any) {
    const clients = this.clients.get(organizationId);
    if (clients) {
      const message: WebSocketMessage = {
        type: 'job_status',
        data: jobData,
        timestamp: Date.now(),
        organizationId
      };

      clients.forEach(client => this.sendToClient(client, message));
    }
  }

  public broadcastNotification(organizationId: string, notification: any) {
    const clients = this.clients.get(organizationId);
    if (clients) {
      const message: WebSocketMessage = {
        type: 'notification',
        data: notification,
        timestamp: Date.now(),
        organizationId
      };

      clients.forEach(client => this.sendToClient(client, message));
    }
  }

  public broadcastAnalyticsUpdate(organizationId: string, analytics: any) {
    const clients = this.clients.get(organizationId);
    if (clients) {
      const message: WebSocketMessage = {
        type: 'analytics',
        data: analytics,
        timestamp: Date.now(),
        organizationId
      };

      clients.forEach(client => this.sendToClient(client, message));
    }
  }

  public sendToUser(userId: string, message: WebSocketMessage) {
    for (const [organizationId, clients] of this.clients.entries()) {
      for (const client of clients) {
        if (client.userId === userId) {
          this.sendToClient(client, { ...message, userId, organizationId });
          return;
        }
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [organizationId, clients] of this.clients.entries()) {
        const clientsToRemove: AuthenticatedWebSocket[] = [];

        clients.forEach(client => {
          if (client.lastPing && now - client.lastPing > 60000) { // 60 seconds timeout
            clientsToRemove.push(client);
          } else if (client.readyState === WebSocket.OPEN) {
            // Send ping
            this.sendToClient(client, {
              type: 'ping',
              data: {},
              timestamp: now
            });
          }
        });

        // Remove dead clients
        clientsToRemove.forEach(client => {
          clients.delete(client);
          client.terminate();
        });

        if (clients.size === 0) {
          this.clients.delete(organizationId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  public getClientCount(organizationId?: string): number {
    if (organizationId) {
      return this.clients.get(organizationId)?.size || 0;
    }

    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.size;
    }
    return total;
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    // Close all client connections
    for (const clients of this.clients.values()) {
      clients.forEach(client => client.close());
    }

    this.clients.clear();
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// AuthenticatedWebSocket interface is already exported above
