const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.resolve(
        process.env.DB_PATH || "./database/selfinotify.db"
      );

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          reject(err);
        } else {
          console.log("Connected to SQLite database");
          this.initializeTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  initializeTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    npk VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

      const createApplicationsTable = `
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(150) NOT NULL,
                    description TEXT,
                    platform VARCHAR(20) NOT NULL,
                    app_token VARCHAR(255) UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

      const createNotificationHistoryTable = `
                CREATE TABLE IF NOT EXISTS notification_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    file_url VARCHAR(500),
                    status VARCHAR(50) NOT NULL DEFAULT 'SENT',
                    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
                )
            `;

      // Execute table creation queries
      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error("Error creating users table:", err.message);
            reject(err);
            return;
          }
        });

        this.db.run(createApplicationsTable, (err) => {
          if (err) {
            console.error("Error creating applications table:", err.message);
            reject(err);
            return;
          }
        });

        this.db.run(createNotificationHistoryTable, (err) => {
          if (err) {
            console.error(
              "Error creating notification_history table:",
              err.message
            );
            reject(err);
            return;
          }
          console.log("All database tables initialized successfully");
          resolve();
        });
      });
    });
  }

  getDatabase() {
    return this.db;
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err.message);
          } else {
            console.log("Database connection closed");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
