const database = require('../config/database');

class ApplicationModel {
    /**
     * Create new application
     * @param {Object} appData 
     * @returns {Promise<Object>}
     */
    static create(appData) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const { user_id, name, description, app_token } = appData;
            
            const query = `
                INSERT INTO applications (user_id, name, description, app_token)
                VALUES (?, ?, ?, ?)
            `;
            
            db.run(query, [user_id, name, description, app_token], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        user_id,
                        name,
                        description,
                        app_token
                    });
                }
            });
        });
    }

    /**
     * Get applications by user ID
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static getByUserId(userId) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT id, name, description, app_token, created_at
                FROM applications 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `;
            
            db.all(query, [userId], (err, rows) => {
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
            const query = 'SELECT * FROM applications WHERE app_token = ?';
            
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
            const query = 'SELECT * FROM applications WHERE id = ?';
            
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
     * Find application by ID and user ID (for authorization)
     * @param {number} id 
     * @param {number} userId 
     * @returns {Promise<Object|null>}
     */
    static findByIdAndUserId(id, userId) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'SELECT * FROM applications WHERE id = ? AND user_id = ?';
            
            db.get(query, [id, userId], (err, row) => {
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
     * @param {number} userId 
     * @param {Object} updateData 
     * @returns {Promise<boolean>}
     */
    static update(id, userId, updateData) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const { name, description } = updateData;
            
            let query = 'UPDATE applications SET ';
            let params = [];
            let updates = [];
            
            if (name) {
                updates.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            
            if (updates.length === 0) {
                resolve(false);
                return;
            }
            
            query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
            params.push(id, userId);
            
            db.run(query, params, function(err) {
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
     * @param {number} userId 
     * @returns {Promise<boolean>}
     */
    static delete(id, userId) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'DELETE FROM applications WHERE id = ? AND user_id = ?';
            
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
     * Get all applications (admin only)
     * @returns {Promise<Array>}
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = `
                SELECT a.*, u.npk as owner_npk
                FROM applications a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
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
}

module.exports = ApplicationModel;

