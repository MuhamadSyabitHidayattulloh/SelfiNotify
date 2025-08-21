const express = require("express");
const NotificationController = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route POST /api/notifications/send
 * @desc Send notification to application
 * @access Private
 */
router.post("/send", verifyToken, NotificationController.send);

/**
 * @route POST /api/notifications/bulk-send
 * @desc Send notification to multiple applications
 * @access Private
 */
router.post("/bulk-send", verifyToken, NotificationController.bulkSend);

/**
 * @route POST /api/notifications/test
 * @desc Send test notification
 * @access Private
 */
router.post("/test", verifyToken, NotificationController.sendTest);

/**
 * @route GET /api/notifications/history
 * @desc Get user's notification history
 * @access Private
 */
router.get("/history", verifyToken, NotificationController.getHistory);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
 * @access Private
 */
router.get("/stats", verifyToken, NotificationController.getStats);

/**
 * @route GET /api/notifications/all
 * @desc Get all notifications
 * @access Private
 */
router.get("/all", verifyToken, NotificationController.getAll);

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Private
 */
router.get("/:id", verifyToken, NotificationController.getById);

/**
 * @route POST /api/notifications/:id/resend
 * @desc Resend notification
 * @access Private
 */
router.post("/:id/resend", verifyToken, NotificationController.resend);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete("/:id", verifyToken, NotificationController.delete);

/**
 * @route POST /api/notifications/bulk-delete
 * @desc Bulk delete notifications
 * @access Private
 */
router.post("/bulk-delete", verifyToken, NotificationController.bulkDelete);

module.exports = router;
