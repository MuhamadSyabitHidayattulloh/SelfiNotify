const NotificationHistory = require("../models/notification.model"); // Changed from NotificationModel
const Application = require("../models/application.model"); // Changed from ApplicationModel
const { Op } = require("sequelize");

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
      const application = await Application.findByPk(application_id); // Using Sequelize findByPk
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Create notification record
      const notification = await NotificationHistory.create({
        application_id,
        title: title.trim(),
        message: message.trim(),
        file_url: file_url ? file_url.trim() : null,
        status: "SENT",
      });

      // TODO: Send notification via WebSocket
      // This will be implemented in the WebSocket service
      const io = req.app.get("io");
      if (io) {
        io.to(application.app_token).emit("notification", {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          file_url: notification.file_url,
          sent_at: new Date().toISOString(),
        });
      }

      res.status(201).json({
        success: true,
        message: "Notifikasi berhasil dikirim",
        data: {
          notification,
        },
      });
    } catch (error) {
      console.error("Send notification error:", error);
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
      const { limit = 50, offset = 0, application_id } = req.query;

      let whereClause = {};
      if (application_id) {
        // Check if application exists
        const application = await Application.findByPk(application_id); // Using Sequelize findByPk
        if (!application) {
          return res.status(404).json({
            success: false,
            message: "Aplikasi tidak ditemukan",
          });
        }
        whereClause.application_id = application_id;
      }

      const notifications = await NotificationHistory.findAll({
        where: whereClause,
        include: [{
          model: Application,
          attributes: ["name"],
        }],
        order: [["sent_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: notification.status,
        sent_at: notification.sent_at,
        application_name: notification.Application ? notification.Application.name : null,
      }));

      res.json({
        success: true,
        data: {
          notifications: formattedNotifications,
        },
      });
    } catch (error) {
      console.error("Get notification history error:", error);
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

      const notification = await NotificationHistory.findByPk(id, {
        include: [{
          model: Application,
          attributes: ["name"],
        }],
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
            sent_at: notification.sent_at,
            application_name: notification.Application ? notification.Application.name : null,
          },
        },
      });
    } catch (error) {
      console.error("Get notification by ID error:", error);
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

      const notification = await NotificationHistory.findByPk(id);
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
      const newNotification = await NotificationHistory.create({
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: "SENT",
      });

      // Send notification via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(application.app_token).emit("notification", {
          id: newNotification.id,
          title: newNotification.title,
          message: newNotification.message,
          file_url: newNotification.file_url,
          sent_at: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        message: "Notifikasi berhasil dikirim ulang",
        data: {
          notification: newNotification,
        },
      });
    } catch (error) {
      console.error("Resend notification error:", error);
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
      const notification = await NotificationHistory.create({
        application_id,
        title: "Test Notification",
        message: `Ini adalah notifikasi test untuk aplikasi "${application.name}". Jika Anda menerima pesan ini, berarti koneksi WebSocket berfungsi dengan baik.`,
        file_url: null,
        status: "SENT",
      });

      // Send test notification via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(application.app_token).emit("notification", {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          file_url: notification.file_url,
          sent_at: new Date().toISOString(),
          is_test: true,
        });
      }

      res.json({
        success: true,
        message: "Notifikasi test berhasil dikirim",
        data: {
          notification,
        },
      });
    } catch (error) {
      console.error("Send test notification error:", error);
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
      const total_notifications = await NotificationHistory.count();
      const today_notifications = await NotificationHistory.count({
        where: {
          sent_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(new Date().setHours(24, 0, 0, 0)),
          },
        },
      });
      const sent_notifications = await NotificationHistory.count({
        where: { status: "SENT" },
      });
      const failed_notifications = await NotificationHistory.count({
        where: { status: "FAILED" },
      });

      res.json({
        success: true,
        data: {
          stats: {
            total_notifications,
            today_notifications,
            sent_notifications,
            failed_notifications,
          },
        },
      });
    } catch (error) {
      console.error("Get notification stats error:", error);
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

      const deletedCount = await NotificationHistory.destroy({
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
      console.error("Delete notification error:", error);
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
      const { limit = 100, offset = 0 } = req.query;
      const notifications = await NotificationHistory.findAll({
        include: [{
          model: Application,
          attributes: ["name"],
        }],
        order: [["sent_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        application_id: notification.application_id,
        title: notification.title,
        message: notification.message,
        file_url: notification.file_url,
        status: notification.status,
        sent_at: notification.sent_at,
        application_name: notification.Application ? notification.Application.name : null,
      }));

      res.json({
        success: true,
        data: {
          notifications: formattedNotifications,
        },
      });
    } catch (error) {
      console.error("Get all notifications error:", error);
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
      const deletedCount = await NotificationHistory.destroy({
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
      console.error("Bulk delete notifications error:", error);
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
        status: "SENT",
      }));

      // Create notification records
      const createdNotifications = await NotificationHistory.bulkCreate(
        notificationsData
      );

      // Send notifications via WebSocket
      const io = req.app.get("io");
      if (io) {
        for (const notification of createdNotifications) {
          const application = applicationChecks.find(
            (app) => app.id === notification.application_id
          );
          if (application) {
            io.to(application.app_token).emit("notification", {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              file_url: notification.file_url,
              sent_at: new Date().toISOString(),
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        message: `${createdNotifications.length} notifikasi berhasil dikirim`,
        data: {
          notifications: createdNotifications,
        },
      });
    } catch (error) {
      console.error("Bulk send notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = NotificationController;


