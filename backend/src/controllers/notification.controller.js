const Notification = require("../models/notification.model");
const Application = require("../models/application.model");
const { Op } = require("sequelize");
const queueService = require("../services/queue.service");
const logger = require("../utils/logger");

class NotificationController {
  /**
   * Send notification
   */
  static async send(req, res) {
    try {
      const { application_id, title, message, file_url } = req.body;

      // Validation
      if (!application_id || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Application ID, title, dan message harus diisi",
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Title maksimal 255 karakter",
        });
      }

      // Check if application exists
      const application = await Application.findByPk(application_id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Create notification record with pending status
      const notification = await Notification.create({
        application_id,
        title: title.trim(),
        message: message.trim(),
        file_url: file_url ? file_url.trim() : null,
        status: "pending",
      });

      // Add notification to queue instead of sending directly
      try {
        const queueResult = await queueService.addNotificationToQueue({
          notificationId: notification.id,
          applicationId: application.id,
          appToken: application.app_token,
          title: notification.title,
          message: notification.message,
          fileUrl: notification.file_url,
        });

        // Update notification status to queued
        await notification.update({ status: "queued" });

        logger.info(
          `Notification ${notification.id} queued successfully:`,
          queueResult
        );

        res.status(201).json({
          success: true,
          message: "Notifikasi berhasil ditambahkan ke antrean",
          data: {
            notification: {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              file_url: notification.file_url,
              status: notification.status,
              sent_at: notification.sent_at,
            },
            queue: queueResult,
          },
        });
      } catch (queueError) {
        logger.error(
          `Failed to queue notification ${notification.id}:`,
          queueError
        );

        // Update notification status to failed
        await notification.update({
          status: "failed",
          delivery_attempts: 1,
          last_delivery_attempt: new Date(),
        });

        res.status(500).json({
          success: false,
          message:
            "Notifikasi berhasil disimpan tapi gagal ditambahkan ke antrean",
          data: {
            notification: {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              file_url: notification.file_url,
              status: notification.status,
            },
            error: "Queue service unavailable",
          },
        });
      }
    } catch (error) {
      logger.error("Send notification error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get notification history
   */
  static async getHistory(req, res) {
    try {
      const { limit = 50, offset = 0, application_id, status } = req.query;

      let whereClause = {};
      if (application_id) {
        // Check if application exists
        const application = await Application.findByPk(application_id);
        if (!application) {
          return res.status(404).json({
            success: false,
            message: "Aplikasi tidak ditemukan",
          });
        }
        whereClause.application_id = application_id;
      }

      if (status) {
        whereClause.status = status;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        include: [
          {
            model: Application,
            attributes: ["name"],
          },
        ],
        order: [["sent_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const formattedNotifications = notifications.map((notification) => ({
        id: notification.id,
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: notification.status,
        delivery_attempts: notification.delivery_attempts,
        max_retries: notification.max_retries,
        last_delivery_attempt: notification.last_delivery_attempt,
        sent_at: notification.sent_at,
        delivered_at: notification.delivered_at,
        application_name: notification.Application
          ? notification.Application.name
          : null,
      }));

      res.json({
        success: true,
        data: {
          notifications: formattedNotifications,
        },
      });
    } catch (error) {
      logger.error("Get notification history error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get notification by ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id, {
        include: [
          {
            model: Application,
            attributes: ["name"],
          },
        ],
      });
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          notification: {
            id: notification.id,
            application_id: notification.application_id,
            title: notification.title,
            message: notification.message,
            file_url: notification.file_url,
            status: notification.status,
            delivery_attempts: notification.delivery_attempts,
            max_retries: notification.max_retries,
            last_delivery_attempt: notification.last_delivery_attempt,
            sent_at: notification.sent_at,
            delivered_at: notification.delivered_at,
            application_name: notification.Application
              ? notification.Application.name
              : null,
          },
        },
      });
    } catch (error) {
      logger.error("Get notification by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Resend notification
   */
  static async resend(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan",
        });
      }

      // Get application info
      const application = await Application.findByPk(
        notification.application_id
      );
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Create new notification record
      const newNotification = await Notification.create({
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: "pending",
      });

      // Add to queue instead of sending directly
      try {
        const queueResult = await queueService.addNotificationToQueue({
          notificationId: newNotification.id,
          applicationId: application.id,
          appToken: application.app_token,
          title: newNotification.title,
          message: newNotification.message,
          fileUrl: newNotification.file_url,
        });

        // Update notification status to queued
        await newNotification.update({ status: "queued" });

        res.json({
          success: true,
          message:
            "Notifikasi berhasil ditambahkan ke antrean untuk dikirim ulang",
          data: {
            notification: {
              id: newNotification.id,
              title: newNotification.title,
              message: newNotification.message,
              file_url: newNotification.file_url,
              status: newNotification.status,
            },
            queue: queueResult,
          },
        });
      } catch (queueError) {
        logger.error(
          `Failed to queue resend notification ${newNotification.id}:`,
          queueError
        );

        // Update notification status to failed
        await newNotification.update({
          status: "failed",
          delivery_attempts: 1,
          last_delivery_attempt: new Date(),
        });

        res.status(500).json({
          success: false,
          message:
            "Notifikasi berhasil dibuat tapi gagal ditambahkan ke antrean",
          data: {
            notification: {
              id: newNotification.id,
              title: newNotification.title,
              message: newNotification.message,
              file_url: newNotification.file_url,
              status: newNotification.status,
            },
            error: "Queue service unavailable",
          },
        });
      }
    } catch (error) {
      logger.error("Resend notification error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Send test notification
   */
  static async sendTest(req, res) {
    try {
      const { application_id } = req.body;

      // Check if application exists
      const application = await Application.findByPk(application_id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Create test notification record
      const notification = await Notification.create({
        application_id,
        title: "Test Notification",
        message: `Ini adalah notifikasi test untuk aplikasi "${application.name}". Jika Anda menerima pesan ini, berarti koneksi WebSocket berfungsi dengan baik.`,
        file_url: null,
        status: "pending",
      });

      // Add to queue instead of sending directly
      try {
        const queueResult = await queueService.addNotificationToQueue({
          notificationId: notification.id,
          applicationId: application.id,
          appToken: application.app_token,
          title: notification.title,
          message: notification.message,
          fileUrl: notification.file_url,
        });

        // Update notification status to queued
        await notification.update({ status: "queued" });

        res.json({
          success: true,
          message: "Notifikasi test berhasil ditambahkan ke antrean",
          data: {
            notification: {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              file_url: notification.file_url,
              status: notification.status,
            },
            queue: queueResult,
          },
        });
      } catch (queueError) {
        logger.error(
          `Failed to queue test notification ${notification.id}:`,
          queueError
        );

        // Update notification status to failed
        await notification.update({
          status: "failed",
          delivery_attempts: 1,
          last_delivery_attempt: new Date(),
        });

        res.status(500).json({
          success: false,
          message:
            "Notifikasi test berhasil dibuat tapi gagal ditambahkan ke antrean",
          data: {
            notification: {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              file_url: notification.file_url,
              status: notification.status,
            },
            error: "Queue service unavailable",
          },
        });
      }
    } catch (error) {
      logger.error("Send test notification error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get notification statistics
   */
  static async getStats(req, res) {
    try {
      const total_notifications = await Notification.count();
      const today_notifications = await Notification.count({
        where: {
          sent_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(new Date().setHours(24, 0, 0, 0)),
          },
        },
      });

      // Get status-based statistics
      const pending_count = await Notification.count({
        where: { status: "pending" },
      });
      const queued_count = await Notification.count({
        where: { status: "queued" },
      });
      const sent_count = await Notification.count({
        where: { status: "sent" },
      });
      const delivered_count = await Notification.count({
        where: { status: "delivered" },
      });
      const failed_count = await Notification.count({
        where: { status: "failed" },
      });

      // Get queue statistics
      const queueStats = await queueService.getQueueStats();

      res.json({
        success: true,
        data: {
          stats: {
            total_notifications,
            today_notifications,
            by_status: {
              pending: pending_count,
              queued: queued_count,
              sent: sent_count,
              delivered: delivered_count,
              failed: failed_count,
            },
            queue: queueStats,
          },
        },
      });
    } catch (error) {
      logger.error("Get notification stats error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Delete notification
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const deletedCount = await Notification.destroy({
        where: { id },
      });
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan",
        });
      }

      res.json({
        success: true,
        message: "Notifikasi berhasil dihapus",
      });
    } catch (error) {
      logger.error("Delete notification error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get all notifications
   */
  static async getAll(req, res) {
    try {
      const { limit = 100, offset = 0, status } = req.query;

      let whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        include: [
          {
            model: Application,
            attributes: ["name"],
          },
        ],
        order: [["sent_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const formattedNotifications = notifications.map((notification) => ({
        id: notification.id,
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: notification.status,
        delivery_attempts: notification.delivery_attempts,
        max_retries: notification.max_retries,
        last_delivery_attempt: notification.last_delivery_attempt,
        sent_at: notification.sent_at,
        delivered_at: notification.delivered_at,
        application_name: notification.Application
          ? notification.Application.name
          : null,
      }));

      res.json({
        success: true,
        data: {
          notifications: formattedNotifications,
        },
      });
    } catch (error) {
      logger.error("Get all notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Bulk delete notifications
   */
  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ID notifikasi harus berupa array dan tidak boleh kosong",
        });
      }

      // Validate that all IDs are numbers
      if (!ids.every((id) => Number.isInteger(Number(id)) && Number(id) > 0)) {
        return res.status(400).json({
          success: false,
          message: "Semua ID notifikasi harus berupa angka positif",
        });
      }

      // Delete notifications
      const deletedCount = await Notification.destroy({
        where: {
          id: ids,
        },
      });

      res.json({
        success: true,
        message: `${deletedCount} notifikasi berhasil dihapus`,
        data: {
          deleted_count: deletedCount,
        },
      });
    } catch (error) {
      logger.error("Bulk delete notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Bulk send notifications to multiple applications
   */
  static async bulkSend(req, res) {
    try {
      const { applications, title, message, file_url } = req.body;

      // Validation
      if (
        !applications ||
        !Array.isArray(applications) ||
        applications.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Daftar aplikasi harus berupa array dan tidak boleh kosong",
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: "Title dan message harus diisi",
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Title maksimal 255 karakter",
        });
      }

      // Validate application IDs
      if (
        !applications.every(
          (app) => Number.isInteger(Number(app)) && Number(app) > 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Semua ID aplikasi harus berupa angka positif",
        });
      }

      // Check if all applications exist
      const applicationChecks = await Promise.all(
        applications.map((id) => Application.findByPk(id))
      );

      const invalidApps = applicationChecks.filter((app) => !app);
      if (invalidApps.length > 0) {
        return res.status(404).json({
          success: false,
          message: "Beberapa aplikasi tidak ditemukan",
        });
      }

      // Prepare notifications data
      const notificationsData = applications.map((application_id) => ({
        application_id: parseInt(application_id),
        title: title.trim(),
        message: message.trim(),
        file_url: file_url ? file_url.trim() : null,
        status: "pending",
      }));

      // Create notification records
      const createdNotifications = await Notification.bulkCreate(
        notificationsData
      );

      // Add all notifications to queue
      const queueResults = [];
      for (const notification of createdNotifications) {
        const application = applicationChecks.find(
          (app) => app.id === notification.application_id
        );

        if (application) {
          try {
            const queueResult = await queueService.addNotificationToQueue({
              notificationId: notification.id,
              applicationId: application.id,
              appToken: application.app_token,
              title: notification.title,
              message: notification.message,
              fileUrl: notification.file_url,
            });

            // Update notification status to queued
            await notification.update({ status: "queued" });

            queueResults.push({
              notificationId: notification.id,
              success: true,
              queue: queueResult,
            });
          } catch (queueError) {
            logger.error(
              `Failed to queue notification ${notification.id}:`,
              queueError
            );

            // Update notification status to failed
            await notification.update({
              status: "failed",
              delivery_attempts: 1,
              last_delivery_attempt: new Date(),
            });

            queueResults.push({
              notificationId: notification.id,
              success: false,
              error: "Queue service unavailable",
            });
          }
        }
      }

      const successfulCount = queueResults.filter((r) => r.success).length;
      const failedCount = queueResults.length - successfulCount;

      res.status(201).json({
        success: true,
        message: `${successfulCount} notifikasi berhasil ditambahkan ke antrean, ${failedCount} gagal`,
        data: {
          notifications: createdNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            file_url: n.file_url,
            status: n.status,
          })),
          queue_results: queueResults,
        },
      });
    } catch (error) {
      logger.error("Bulk send notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Retry failed notifications
   */
  static async retryFailed(req, res) {
    try {
      const { application_id } = req.query;

      let whereClause = { status: "failed" };
      if (application_id) {
        whereClause.application_id = application_id;
      }

      // Get failed notifications
      const failedNotifications = await Notification.findAll({
        where: whereClause,
        include: [
          {
            model: Application,
            attributes: ["name", "app_token"],
          },
        ],
      });

      if (failedNotifications.length === 0) {
        return res.json({
          success: true,
          message: "Tidak ada notifikasi yang gagal untuk di-retry",
          data: { retried_count: 0 },
        });
      }

      // Retry each failed notification
      const retryResults = [];
      for (const notification of failedNotifications) {
        try {
          const queueResult = await queueService.addNotificationToQueue({
            notificationId: notification.id,
            applicationId: notification.application_id,
            appToken: notification.Application.app_token,
            title: notification.title,
            message: notification.message,
            fileUrl: notification.file_url,
          });

          // Update notification status to queued
          await notification.update({
            status: "queued",
            delivery_attempts: 0, // Reset delivery attempts
            last_delivery_attempt: null,
          });

          retryResults.push({
            notificationId: notification.id,
            success: true,
            queue: queueResult,
          });
        } catch (queueError) {
          logger.error(
            `Failed to retry notification ${notification.id}:`,
            queueError
          );

          retryResults.push({
            notificationId: notification.id,
            success: false,
            error: "Queue service unavailable",
          });
        }
      }

      const successfulRetries = retryResults.filter((r) => r.success).length;

      res.json({
        success: true,
        message: `${successfulRetries} notifikasi berhasil di-retry`,
        data: {
          retried_count: successfulRetries,
          retry_results: retryResults,
        },
      });
    } catch (error) {
      logger.error("Retry failed notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = NotificationController;
