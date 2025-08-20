const database = require('../config/database');

class UserModel {
    /**
     * Find user by NPK
     * @param {string} npk 
     * @returns {Promise<Object|null>}
     */
    static findByNpk(npk) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'SELECT * FROM users WHERE npk = ?';
            
            db.get(query, [npk], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Find user by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static findById(id) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'SELECT * FROM users WHERE id = ?';
            
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
     * Create new user
     * @param {Object} userData 
     * @returns {Promise<Object>}
     */
    static create(userData) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const { npk, password_hash, role = 'user' } = userData;
            
            const query = `
                INSERT INTO users (npk, password_hash, role)
                VALUES (?, ?, ?)
            `;
            
            db.run(query, [npk, password_hash, role], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        npk,
                        role
                    });
                }
            });
        });
    }

    /**
     * Get all users
     * @returns {Promise<Array>}
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'SELECT id, npk, role, created_at FROM users ORDER BY created_at DESC';
            
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
     * Update user
     * @param {number} id 
     * @param {Object} updateData 
     * @returns {Promise<boolean>}
     */
    static update(id, updateData) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const { npk, password_hash, role } = updateData;
            
            let query = 'UPDATE users SET ';
            let params = [];
            let updates = [];
            
            if (npk) {
                updates.push('npk = ?');
                params.push(npk);
            }
            if (password_hash) {
                updates.push('password_hash = ?');
                params.push(password_hash);
            }
            if (role) {
                updates.push('role = ?');
                params.push(role);
            }
            
            if (updates.length === 0) {
                resolve(false);
                return;
            }
            
            query += updates.join(', ') + ' WHERE id = ?';
            params.push(id);
            
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
     * Delete user
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static delete(id) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            const query = 'DELETE FROM users WHERE id = ?';
            
            db.run(query, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }
}

module.exports = UserModel;

