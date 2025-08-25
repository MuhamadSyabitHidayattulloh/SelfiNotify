const { Server } = require("socket.io");
const Application = require("../models/application.model");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Track connected clients per app token
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5175", // Alamat frontend
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
    console.log("Socket.IO server initialized");
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle client authentication with app token
      socket.on("authenticate", async (data) => {
        try {
          const { app_token } = data;

          if (!app_token) {
            socket.emit("auth_error", {
              message: "App token is required",
            });
            return;
          }

          // Verify app token exists in database
          const application = await Application.findOne({
            where: { app_token: app_token },
          });
          if (!application) {
            socket.emit("auth_error", {
              message: "Invalid app token",
            });
            return;
          }

          // Join room based on app token
          socket.join(app_token);
          socket.app_token = app_token;
          socket.application_id = application.id;

          // Track connected client
          if (!this.connectedClients.has(app_token)) {
            this.connectedClients.set(app_token, new Set());
          }
          this.connectedClients.get(app_token).add(socket.id);

          // Send authentication success
          socket.emit("authenticated", {
            message: "Successfully authenticated",
            application: {
              id: application.id,
              name: application.name,
              description: application.description,
            },
          });

          // Notify dashboard about new client connection
          this.notifyDashboard("client_connected", {
            app_token,
            application_id: application.id,
            client_count: this.connectedClients.get(app_token).size,
          });

          console.log(
            `Client ${socket.id} authenticated for app: ${application.name}`
          );
        } catch (error) {
          console.error("Authentication error:", error);
          socket.emit("auth_error", {
            message: "Authentication failed",
          });
        }
      });

      // Handle client disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (socket.app_token) {
          // Remove from connected clients tracking
          const clients = this.connectedClients.get(socket.app_token);
          if (clients) {
            clients.delete(socket.id);

            // Clean up empty sets
            if (clients.size === 0) {
              this.connectedClients.delete(socket.app_token);
            }

            // Notify dashboard about client disconnection
            this.notifyDashboard("client_disconnected", {
              app_token: socket.app_token,
              application_id: socket.application_id,
              client_count: clients.size,
            });
          }
        }
      });

      // Handle ping from clients (for connection health check)
      socket.on("ping", () => {
        socket.emit("pong", {
          timestamp: new Date().toISOString(),
        });
      });

      // Handle dashboard connection
      socket.on("dashboard_connect", (data) => {
        const { user_id } = data;
        if (user_id) {
          socket.join(`dashboard_${user_id}`);
          socket.user_id = user_id;
          console.log(`Dashboard connected for user: ${user_id}`);

          // Send current connection stats
          this.sendConnectionStats(socket);
        }
      });
    });
  }

  /**
   * Send notification to specific application room
   * @param {string} app_token
   * @param {Object} notification
   */
  sendNotification(app_token, notification) {
    if (this.io) {
      this.io.to(app_token).emit("notification", notification);
      console.log(`Notification sent to app token: ${app_token}`);
    }
  }

  /**
   * Notify dashboard about events
   * @param {string} event
   * @param {Object} data
   */
  notifyDashboard(event, data) {
    if (this.io) {
      this.io.emit(`dashboard:${event}`, data);
    }
  }

  /**
   * Send connection statistics to dashboard
   * @param {Object} socket
   */
  sendConnectionStats(socket) {
    const stats = {};
    for (const [app_token, clients] of this.connectedClients.entries()) {
      stats[app_token] = clients.size;
    }

    socket.emit("connection_stats", {
      total_connections: Array.from(this.connectedClients.values()).reduce(
        (sum, clients) => sum + clients.size,
        0
      ),
      apps: stats,
    });
  }

  /**
   * Get connected clients count for specific app token
   * @param {string} app_token
   * @returns {number}
   */
  getConnectedClientsCount(app_token) {
    const clients = this.connectedClients.get(app_token);
    return clients ? clients.size : 0;
  }

  /**
   * Get total connected clients count
   * @returns {number}
   */
  getTotalConnectedClients() {
    return Array.from(this.connectedClients.values()).reduce(
      (sum, clients) => sum + clients.size,
      0
    );
  }

  /**
   * Get Socket.IO instance
   * @returns {Object}
   */
  getIO() {
    return this.io;
  }

  /**
   * Broadcast message to all connected clients
   * @param {string} event
   * @param {Object} data
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Send message to specific room
   * @param {string} room
   * @param {string} event
   * @param {Object} data
   */
  sendToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

module.exports = new SocketService();
