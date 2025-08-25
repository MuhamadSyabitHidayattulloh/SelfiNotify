/**
 * Centralized logging utility for SelfiNotify backend
 */

const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, data ? data : "");
  },

  error: (message, error = null, context = "") => {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      message,
      context,
      timestamp,
      stack: error?.stack,
      details: error?.message || error,
    };
    console.error(`[ERROR] ${timestamp} - ${message}`, errorInfo);
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, data ? data : "");
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] ${timestamp} - ${message}`, data ? data : "");
    }
  },
};

module.exports = logger;
