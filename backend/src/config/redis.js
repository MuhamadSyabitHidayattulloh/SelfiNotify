const Redis = require("ioredis");
const logger = require("../utils/logger");

class RedisConfig {
  constructor() {
    this.redis = null;
    this.connectionOptions = {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: null, // Required for BullMQ
      lazyConnect: true,
    };
  }

  async connect() {
    try {
      this.redis = new Redis(this.connectionOptions);

      this.redis.on("connect", () => {
        logger.info("Redis connected successfully");
      });

      this.redis.on("error", (error) => {
        logger.error("Redis connection error:", error);
      });

      this.redis.on("close", () => {
        logger.warn("Redis connection closed");
      });

      this.redis.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      // Test connection
      await this.redis.ping();
      logger.info("Redis connection test successful");

      return this.redis;
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  getClient() {
    if (!this.redis) {
      throw new Error("Redis not connected. Call connect() first.");
    }
    return this.redis;
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      logger.info("Redis disconnected");
    }
  }

  async healthCheck() {
    try {
      if (!this.redis) {
        return { status: "disconnected", message: "Redis not connected" };
      }

      const result = await this.redis.ping();
      return {
        status: "connected",
        message: "Redis is healthy",
        response: result,
      };
    } catch (error) {
      return {
        status: "error",
        message: "Redis health check failed",
        error: error.message,
      };
    }
  }
}

module.exports = new RedisConfig();
