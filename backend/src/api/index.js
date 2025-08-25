const express = require("express");
const authRoutes = require("./auth.routes");
const applicationRoutes = require("./application.routes");
const notificationRoutes = require("./notification.routes");
const socketService = require("../services/socket.service");
const logger = require("../utils/logger");

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SelfiNotify API is running",
    timestamp: new Date().toISOString(),
  });
});

// Socket connection stats endpoint
router.get("/socket/connection-stats", (req, res) => {
  try {
    const stats = socketService.getConnectionStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(
      "Failed to get connection stats",
      error,
      "API.connection-stats"
    );
    res.status(500).json({
      success: false,
      message: "Failed to get connection stats",
    });
  }
});

// API Routes
router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/notifications", notificationRoutes);

// 404 handler for API routes
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

module.exports = router;
