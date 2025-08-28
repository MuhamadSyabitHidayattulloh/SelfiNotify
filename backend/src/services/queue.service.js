const { Queue, Worker } = require("bullmq");
const redisConfig = require("../config/redis");
const logger = require("../utils/logger");

class QueueService {
  constructor() {
    this.notificationQueue = null;
    this.worker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize queue service
   */
  async initialize() {
    try {
      // Connect to Redis first
      await redisConfig.connect();

      // Create notification queue
      this.notificationQueue = new Queue("notification-queue", {
        connection: redisConfig.getClient(),
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: "exponential",
            delay: 2000, // Start with 2 seconds
          },
        },
      });

      // Create worker to process jobs
      this.worker = new Worker(
        "notification-queue",
        async (job) => {
          return await this.processNotificationJob(job);
        },
        {
          connection: redisConfig.getClient(),
          concurrency: 10, // Process 10 jobs concurrently
        }
      );

      // Setup worker event handlers
      this.setupWorkerEventHandlers();

      this.isInitialized = true;
      logger.info("Queue service initialized successfully");

      return true;
    } catch (error) {
      logger.error("Failed to initialize queue service:", error);
      throw error;
    }
  }

  /**
   * Setup worker event handlers
   */
  setupWorkerEventHandlers() {
    if (!this.worker) return;

    this.worker.on("completed", (job, result) => {
      logger.info(`Job ${job.id} completed successfully:`, result);
    });

    this.worker.on("failed", (job, error) => {
      logger.error(`Job ${job.id} failed:`, error);
    });

    this.worker.on("error", (error) => {
      logger.error("Worker error:", error);
    });

    this.worker.on("stalled", (jobId) => {
      logger.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Add notification to queue
   */
  async addNotificationToQueue(notificationData) {
    try {
      if (!this.isInitialized) {
        throw new Error("Queue service not initialized");
      }

      const job = await this.notificationQueue.add(
        "send-notification",
        {
          notificationId: notificationData.notificationId,
          applicationId: notificationData.applicationId,
          appToken: notificationData.appToken,
          title: notificationData.title,
          message: notificationData.message,
          fileUrl: notificationData.fileUrl,
        },
        {
          jobId: `notification_${notificationData.notificationId}`,
        }
      );

      logger.info(
        `Notification ${notificationData.notificationId} added to queue with job ID: ${job.id}`
      );

      return {
        success: true,
        jobId: job.id,
        message: "Notification added to queue successfully",
      };
    } catch (error) {
      logger.error("Failed to add notification to queue:", error);
      throw error;
    }
  }

  /**
   * Process notification job
   */
  async processNotificationJob(job) {
    try {
      const { notificationId, appToken, title, message, fileUrl } = job.data;

      logger.info(
        `Processing notification job ${job.id} for notification ${notificationId}`
      );

      // Get Socket.IO instance from app context
      const io = global.io; // We'll set this in server.js

      if (!io) {
        throw new Error("Socket.IO not available");
      }

      // Check if there are connected clients for this app token
      const connectedClients = io.sockets.adapter.rooms.get(appToken);
      const clientCount = connectedClients ? connectedClients.size : 0;

      if (clientCount === 0) {
        // No clients connected, job will be retried later
        logger.warn(
          `No clients connected for app token ${appToken}, notification ${notificationId} will be retried`
        );
        throw new Error("No clients connected");
      }

      // Send notification via WebSocket
      io.to(appToken).emit("notification", {
        id: notificationId,
        title,
        message,
        file_url: fileUrl,
        sent_at: new Date().toISOString(),
        job_id: job.id,
      });

      logger.info(
        `Notification ${notificationId} sent successfully to ${clientCount} clients`
      );

      return {
        success: true,
        notificationId,
        clientCount,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to process notification job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      if (!this.notificationQueue) {
        return null;
      }

      const waiting = await this.notificationQueue.getWaiting();
      const active = await this.notificationQueue.getActive();
      const completed = await this.notificationQueue.getCompleted();
      const failed = await this.notificationQueue.getFailed();
      const delayed = await this.notificationQueue.getDelayed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total:
          waiting.length +
          active.length +
          completed.length +
          failed.length +
          delayed.length,
      };
    } catch (error) {
      logger.error("Failed to get queue stats:", error);
      return null;
    }
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanupJobs() {
    try {
      if (!this.notificationQueue) return;

      // Clean up old completed jobs (keep last 100)
      await this.notificationQueue.clean(1000 * 60 * 60 * 24, "completed"); // 24 hours

      // Clean up old failed jobs (keep last 50)
      await this.notificationQueue.clean(1000 * 60 * 60 * 24, "failed"); // 24 hours

      logger.info("Queue cleanup completed");
    } catch (error) {
      logger.error("Failed to cleanup jobs:", error);
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    try {
      if (this.notificationQueue) {
        await this.notificationQueue.pause();
        logger.info("Notification queue paused");
      }
    } catch (error) {
      logger.error("Failed to pause queue:", error);
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    try {
      if (this.notificationQueue) {
        await this.notificationQueue.resume();
        logger.info("Notification queue resumed");
      }
    } catch (error) {
      logger.error("Failed to resume queue:", error);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.worker) {
        await this.worker.close();
      }

      if (this.notificationQueue) {
        await this.notificationQueue.close();
      }

      await redisConfig.disconnect();

      this.isInitialized = false;
      logger.info("Queue service shutdown completed");
    } catch (error) {
      logger.error("Error during queue service shutdown:", error);
    }
  }
}

module.exports = new QueueService();
