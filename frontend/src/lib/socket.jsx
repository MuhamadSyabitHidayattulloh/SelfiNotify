import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.connectionStats = this.loadConnectionStats();
    this.autoReconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(serverUrl = 'http://localhost:3000') {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
      this.autoReconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
      
      // Request connection stats on reconnect
      this.requestConnectionStats();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.emit('connection_error', error);
      
      // Attempt to reconnect
      this.autoReconnectAttempts++;
      if (this.autoReconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.autoReconnectAttempts);
      }
    });

    // Dashboard specific events
    this.socket.on('dashboard:notification_sent', (data) => {
      this.emit('notification_sent', data);
    });

    this.socket.on('connection_stats', (data) => {
      this.updateConnectionStats(data);
      this.emit('connection_stats', data);
    });
  }

  // Update connection stats and save to localStorage
  updateConnectionStats(data) {
    if (data.apps) {
      this.connectionStats = { ...this.connectionStats, ...data.apps };
      this.saveConnectionStats();
    }
  }

  // Save connection stats to localStorage
  saveConnectionStats() {
    try {
      localStorage.setItem('connection_stats', JSON.stringify(this.connectionStats));
    } catch (error) {
      console.error('Failed to save connection stats:', error);
    }
  }

  // Load connection stats from localStorage
  loadConnectionStats() {
    try {
      const stats = localStorage.getItem('connection_stats');
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('Failed to load connection stats:', error);
      return {};
    }
  }

  // Get current connection stats
  getConnectionStats() {
    return this.connectionStats;
  }

  // Request connection stats from server
  requestConnectionStats() {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_connection_stats');
    }
  }

  // Connect dashboard to receive real-time updates
  connectDashboard(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('dashboard_connect', { user_id: userId });
    }
  }

  // Authenticate client with app token (for client applications)
  authenticateClient(appToken) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { app_token: appToken });
    }
  }

  // Send ping to check connection
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // Generic event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also listen on socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event to internal listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send event to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

