const express = require("express");
const NotificationController = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @route POST /api/notifications/send
 * @desc Send notification to single application
 * @access Private
 */
router.post("/send", NotificationController.send);

/**
 * @route POST /api/notifications/test
 * @desc Send test notification to application
 * @access Private
 */
router.post("/test", NotificationController.sendTest);

/**
 * @route GET /api/notifications/stats/overview
 * @desc Get notification statistics and queue status
 * @access Private
 */
router.get("/stats/overview", NotificationController.getStats);

/**
 * @route GET /api/notifications/history
 * @desc Get notification history with filters
 * @access Private
 */
router.get("/history", NotificationController.getHistory);

/**
 * @route DELETE /api/notifications/bulk/delete
 * @desc Bulk delete multiple notifications
 * @access Private
 */
router.delete("/bulk/delete", NotificationController.bulkDelete);

/**
 * @route POST /api/notifications/bulk/send
 * @desc Send notification to multiple applications
 * @access Private
 */
router.post("/bulk/send", NotificationController.bulkSend);

/**
 * @route POST /api/notifications/retry/failed
 * @desc Retry failed notifications
 * @access Private
 */
router.post("/retry/failed", NotificationController.retryFailed);

/**
 * @route GET /api/notifications
 * @desc Get all notifications with optional filters
 * @access Private
 */
router.get("/", NotificationController.getAll);

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Private
 */
router.get("/:id", NotificationController.getById);

/**
 * @route POST /api/notifications/:id/resend
 * @desc Resend specific notification
 * @access Private
 */
router.post("/:id/resend", NotificationController.resend);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete specific notification
 * @access Private
 */
router.delete("/:id", NotificationController.delete);

module.exports = router;
