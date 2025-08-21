const database = require("../config/database");

class NotificationModel {
  /**
   * Create new notification record
   * @param {Object} notificationData
   * @returns {Promise<Object>}
   */
  static create(notificationData) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const {
        application_id,
        title,
        message,
        file_url,
        status = "SENT",
      } = notificationData;

      const query = `
                INSERT INTO notification_history (application_id, title, message, file_url, status)
                VALUES (?, ?, ?, ?, ?)
            `;

      db.run(
        query,
        [application_id, title, message, file_url, status],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              application_id,
              title,
              message,
              file_url,
              status,
            });
          }
        }
      );
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
                SELECT nh.*, a.name as application_name
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
                WHERE nh.application_id = ? 
                ORDER BY nh.sent_at DESC 
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
   * Get all notifications
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  static getAll(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
                SELECT nh.*, a.name as application_name
                FROM notification_history nh
                INNER JOIN applications a ON nh.application_id = a.id
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
   * Get notification by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
                SELECT nh.*, a.name as application_name
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
   * Update notification status
   * @param {number} id
   * @param {string} status
   * @returns {Promise<boolean>}
   */
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = "UPDATE notification_history SET status = ? WHERE id = ?";

      db.run(query, [status, id], function (err) {
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
   * @returns {Promise<boolean>}
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = "DELETE FROM notification_history WHERE id = ?";

      db.run(query, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Bulk delete notifications
   * @param {Array<number>} ids
   * @returns {Promise<number>} Number of deleted notifications
   */
  static bulkDelete(ids) {
    return new Promise((resolve, reject) => {
      if (!ids || ids.length === 0) {
        resolve(0);
        return;
      }

      const db = database.getDatabase();
      const placeholders = ids.map(() => "?").join(",");
      const query = `DELETE FROM notification_history WHERE id IN (${placeholders})`;

      db.run(query, ids, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Bulk create notifications
   * @param {Array<Object>} notifications
   * @returns {Promise<Array>} Array of created notifications
   */
  static bulkCreate(notifications) {
    return new Promise((resolve, reject) => {
      if (!notifications || notifications.length === 0) {
        resolve([]);
        return;
      }

      const db = database.getDatabase();
      const placeholders = notifications.map(() => "(?, ?, ?, ?, ?)").join(",");
      const query = `
        INSERT INTO notification_history (application_id, title, message, file_url, status)
        VALUES ${placeholders}
      `;

      const values = [];
      notifications.forEach((notification) => {
        values.push(
          notification.application_id,
          notification.title,
          notification.message,
          notification.file_url || null,
          notification.status || "SENT"
        );
      });

      db.run(query, values, function (err) {
        if (err) {
          reject(err);
        } else {
          // Get the created notifications
          const createdIds = [];
          for (let i = 0; i < notifications.length; i++) {
            createdIds.push(this.lastID - i);
          }

          const createdNotifications = notifications.map(
            (notification, index) => ({
              id: createdIds[index],
              ...notification,
            })
          );

          resolve(createdNotifications);
        }
      });
    });
  }

  /**
   * Get notification statistics
   * @returns {Promise<Object>}
   */
  static getStats() {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
                SELECT 
                    COUNT(*) as total_notifications,
                    COUNT(CASE WHEN DATE(sent_at) = DATE('now') THEN 1 END) as today_notifications,
                    COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_notifications,
                    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_notifications
                FROM notification_history
            `;

      db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            row || {
              total_notifications: 0,
              today_notifications: 0,
              sent_notifications: 0,
              failed_notifications: 0,
            }
          );
        }
      });
    });
  }
}

module.exports = NotificationModel;
