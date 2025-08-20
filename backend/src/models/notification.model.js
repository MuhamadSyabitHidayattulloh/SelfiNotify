const database = require('../config/database');

class NotificationModel {
    /**
     * Create new notification record
     * @param {Object} notificationData 
     * @returns {Promise<Object>}
     */
    static create(notificationData) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const { application_id, title, message, file_url, status = 'SENT' } = notificationData;
            
            const query = `
                INSERT INTO notification_history (application_id, title, message, file_url, status)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(query, [application_id, title, message, file_url, status], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        application_id,
                        title,
                        message,
                        file_url,
                        status
                    });
                }
            });
        });
    }

    /**
     * Get notifications by application ID
     * @param {number} applicationId 
     * @param {number} limit 
     * @param {number} offset 
     * @returns {Promise<Array>}
     */
    static getByApplicationId(applicationId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT * FROM notification_history 
                WHERE application_id = ? 
                ORDER BY sent_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            db.all(query, [applicationId, limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get notifications by user ID (through applications)
     * @param {number} userId 
     * @param {number} limit 
     * @param {number} offset 
     * @returns {Promise<Array>}
     */
    static getByUserId(userId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT nh.*, a.name as application_name
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
                WHERE a.user_id = ?
                ORDER BY nh.sent_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.all(query, [userId, limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get notification by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static findById(id) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT nh.*, a.name as application_name, a.user_id
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
                WHERE nh.id = ?
            `;
            
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Get all notifications (admin only)
     * @param {number} limit 
     * @param {number} offset 
     * @returns {Promise<Array>}
     */
    static getAll(limit = 100, offset = 0) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT nh.*, a.name as application_name, u.npk as owner_npk
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
                INNER JOIN users u ON a.user_id = u.id
                ORDER BY nh.sent_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.all(query, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Update notification status
     * @param {number} id 
     * @param {string} status 
     * @returns {Promise<boolean>}
     */
    static updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'UPDATE notification_history SET status = ? WHERE id = ?';
            
            db.run(query, [status, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Delete notification
     * @param {number} id 
     * @param {number} userId 
     * @returns {Promise<boolean>}
     */
    static delete(id, userId) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                DELETE FROM notification_history 
                WHERE id = ? AND application_id IN (
                    SELECT id FROM applications WHERE user_id = ?
                )
            `;
            
            db.run(query, [id, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Get notification statistics
     * @param {number} userId 
     * @returns {Promise<Object>}
     */
    static getStats(userId) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT 
                    COUNT(*) as total_notifications,
                    COUNT(CASE WHEN DATE(sent_at) = DATE('now') THEN 1 END) as today_notifications,
                    COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_notifications,
                    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_notifications
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
                WHERE a.user_id = ?
            `;
            
            db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || {
                        total_notifications: 0,
                        today_notifications: 0,
                        sent_notifications: 0,
                        failed_notifications: 0
                    });
                }
            });
        });
    }
}

module.exports = NotificationModel;

