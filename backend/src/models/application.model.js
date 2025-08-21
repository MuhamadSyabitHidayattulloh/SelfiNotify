const database = require("../config/database");

class ApplicationModel {
  /**
   * Create new application
   * @param {Object} appData
   * @returns {Promise<Object>}
   */
  static create(appData) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const { name, description, app_token } = appData;

      const query = `
                INSERT INTO applications (name, description, app_token)
                VALUES (?, ?, ?)
            `;

      db.run(query, [name, description, app_token], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            name,
            description,
            app_token,
          });
        }
      });
    });
  }

  /**
   * Get all applications
   * @returns {Promise<Array>}
   */
  static getAll() {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
                SELECT id, name, description, app_token, created_at
                FROM applications 
                ORDER BY created_at DESC
            `;

      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Find application by token
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  static findByToken(token) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = "SELECT * FROM applications WHERE app_token = ?";

      db.get(query, [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Find application by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = "SELECT * FROM applications WHERE id = ?";

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
   * Update application
   * @param {number} id
   * @param {Object} updateData
   * @returns {Promise<boolean>}
   */
  static update(id, updateData) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const { name, description, app_token } = updateData;

      let query = "UPDATE applications SET ";
      let params = [];
      let updates = [];

      if (name) {
        updates.push("name = ?");
        params.push(name);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        params.push(description);
      }
      if (app_token) {
        updates.push("app_token = ?");
        params.push(app_token);
      }

      if (updates.length === 0) {
        resolve(false);
        return;
      }

      query += updates.join(", ") + " WHERE id = ?";
      params.push(id);

      db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Delete application
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = "DELETE FROM applications WHERE id = ?";

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
   * Bulk delete applications
   * @param {Array<number>} ids
   * @returns {Promise<number>} Number of deleted applications
   */
  static bulkDelete(ids) {
    return new Promise((resolve, reject) => {
      if (!ids || ids.length === 0) {
        resolve(0);
        return;
      }

      const db = database.getDatabase();
      const placeholders = ids.map(() => "?").join(",");
      const query = `DELETE FROM applications WHERE id IN (${placeholders})`;

      db.run(query, ids, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

module.exports = ApplicationModel;
