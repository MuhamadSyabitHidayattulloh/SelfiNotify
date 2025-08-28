const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

// Import configurations and services
const config = require("./config");
const database = require("./config/database");
const socketService = require("./services/socket.service");
const queueService = require("./services/queue.service");
const apiRoutes = require("./api");
const logger = require("./utils/logger");

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Initialize Socket.IO
socketService.initialize(server);

// Make Socket.IO available to controllers and queue service
const io = socketService.getIO();
app.set("io", io);

// Make Socket.IO available globally for queue service
global.io = io;

// Initialize Queue Service
let queueInitialized = false;

// API Routes
app.use("/api", apiRoutes);

// Serve static files (for future frontend build)
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database health
    const dbHealth = await database.healthCheck();

    // Check Redis health
    const redisHealth = await require("./config/redis").healthCheck();

    // Check queue service health
    const queueHealth = queueInitialized
      ? await queueService.getQueueStats()
      : { status: "not_initialized" };

    res.json({
      success: true,
      message: "SelfiNotify Server is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: dbHealth,
        redis: redisHealth,
        queue: queueHealth,
      },
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// Catch-all handler for SPA (Single Page Application)
app.get("*", (req, res) => {
  // Check if it's an API request
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  }

  // For non-API requests, serve the frontend app
  const frontendPath = path.join(__dirname, "../../frontend/dist/index.html");
  res.sendFile(frontendPath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        message: "Frontend not found. Please build the frontend first.",
      });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Global error handler:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await database.connectDB();
    logger.info("Database connected successfully");

    // Initialize queue service
    try {
      await queueService.initialize();
      queueInitialized = true;
      logger.info("Queue service initialized successfully");
    } catch (queueError) {
      logger.error("Failed to initialize queue service:", queueError);
      logger.warn(
        "Server will start without queue service. Notifications will not be processed."
      );
    }

    // Start server
    server.listen(config.port, "0.0.0.0", () => {
      logger.info("=".repeat(50));
      logger.info("🚀 SelfiNotify Server Started");
      logger.info("=".repeat(50));
      logger.info(`📡 Server running on: http://localhost:${config.port}`);
      logger.info(`🔌 WebSocket ready for connections`);
      logger.info(
        `📊 API endpoints available at: http://localhost:${config.port}/api`
      );
      logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
      logger.info(
        `📨 Queue Service: ${queueInitialized ? "✅ Active" : "❌ Inactive"}`
      );
      logger.info("=".repeat(50));
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    // Shutdown queue service
    if (queueInitialized) {
      await queueService.shutdown();
      logger.info("Queue service shutdown completed");
    }

    // Close HTTP server
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
