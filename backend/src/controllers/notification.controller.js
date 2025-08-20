const NotificationModel = require('../models/notification.model');
const ApplicationModel = require('../models/application.model');

class NotificationController {
    /**
     * Send notification
     */
    static async send(req, res) {
        try {
            const { application_id, title, message, file_url } = req.body;
            const userId = req.user.id;

            // Validation
            if (!application_id || !title || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Application ID, title, dan message harus diisi'
                });
            }

            if (title.length > 255) {
                return res.status(400).json({
                    success: false,
                    message: 'Title maksimal 255 karakter'
                });
            }

            // Check if application exists and belongs to user
            const application = await ApplicationModel.findByIdAndUserId(application_id, userId);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Aplikasi tidak ditemukan'
                });
            }

            // Create notification record
            const notification = await NotificationModel.create({
                application_id,
                title: title.trim(),
                message: message.trim(),
                file_url: file_url ? file_url.trim() : null,
                status: 'SENT'
            });

            // TODO: Send notification via WebSocket
            // This will be implemented in the WebSocket service
            const io = req.app.get('io');
            if (io) {
                io.to(application.app_token).emit('notification', {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    file_url: notification.file_url,
                    sent_at: new Date().toISOString()
                });
            }

            res.status(201).json({
                success: true,
                message: 'Notifikasi berhasil dikirim',
                data: {
                    notification
                }
            });

        } catch (error) {
            console.error('Send notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Get user's notification history
     */
    static async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 50, offset = 0, application_id } = req.query;

            let notifications;
            if (application_id) {
                // Check if application belongs to user
                const application = await ApplicationModel.findByIdAndUserId(application_id, userId);
                if (!application) {
                    return res.status(404).json({
                        success: false,
                        message: 'Aplikasi tidak ditemukan'
                    });
                }
                notifications = await NotificationModel.getByApplicationId(application_id, parseInt(limit), parseInt(offset));
            } else {
                notifications = await NotificationModel.getByUserId(userId, parseInt(limit), parseInt(offset));
            }

            res.json({
                success: true,
                data: {
                    notifications
                }
            });

        } catch (error) {
            console.error('Get notification history error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Get notification by ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await NotificationModel.findById(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notifikasi tidak ditemukan'
                });
            }

            // Check if notification belongs to user's application
            if (notification.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Akses ditolak'
                });
            }

            res.json({
                success: true,
                data: {
                    notification
                }
            });

        } catch (error) {
            console.error('Get notification by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Resend notification
     */
    static async resend(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await NotificationModel.findById(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notifikasi tidak ditemukan'
                });
            }

            // Check if notification belongs to user's application
            if (notification.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Akses ditolak'
                });
            }

            // Get application info
            const application = await ApplicationModel.findById(notification.application_id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Aplikasi tidak ditemukan'
                });
            }

            // Create new notification record
            const newNotification = await NotificationModel.create({
                application_id: notification.application_id,
                title: notification.title,
                message: notification.message,
                file_url: notification.file_url,
                status: 'SENT'
            });

            // Send notification via WebSocket
            const io = req.app.get('io');
            if (io) {
                io.to(application.app_token).emit('notification', {
                    id: newNotification.id,
                    title: newNotification.title,
                    message: newNotification.message,
                    file_url: newNotification.file_url,
                    sent_at: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Notifikasi berhasil dikirim ulang',
                data: {
                    notification: newNotification
                }
            });

        } catch (error) {
            console.error('Resend notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Send test notification
     */
    static async sendTest(req, res) {
        try {
            const { application_id } = req.body;
            const userId = req.user.id;

            // Check if application exists and belongs to user
            const application = await ApplicationModel.findByIdAndUserId(application_id, userId);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Aplikasi tidak ditemukan'
                });
            }

            // Create test notification record
            const notification = await NotificationModel.create({
                application_id,
                title: 'Test Notification',
                message: `Ini adalah notifikasi test untuk aplikasi "${application.name}". Jika Anda menerima pesan ini, berarti koneksi WebSocket berfungsi dengan baik.`,
                file_url: null,
                status: 'SENT'
            });

            // Send test notification via WebSocket
            const io = req.app.get('io');
            if (io) {
                io.to(application.app_token).emit('notification', {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    file_url: notification.file_url,
                    sent_at: new Date().toISOString(),
                    is_test: true
                });
            }

            res.json({
                success: true,
                message: 'Notifikasi test berhasil dikirim',
                data: {
                    notification
                }
            });

        } catch (error) {
            console.error('Send test notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Get notification statistics
     */
    static async getStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await NotificationModel.getStats(userId);

            res.json({
                success: true,
                data: {
                    stats
                }
            });

        } catch (error) {
            console.error('Get notification stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Delete notification
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await NotificationModel.delete(id, userId);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Notifikasi tidak ditemukan'
                });
            }

            res.json({
                success: true,
                message: 'Notifikasi berhasil dihapus'
            });

        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }

    /**
     * Get all notifications (admin only)
     */
    static async getAll(req, res) {
        try {
            const { limit = 100, offset = 0 } = req.query;
            const notifications = await NotificationModel.getAll(parseInt(limit), parseInt(offset));

            res.json({
                success: true,
                data: {
                    notifications
                }
            });

        } catch (error) {
            console.error('Get all notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }
}

module.exports = NotificationController;

