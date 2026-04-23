require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_task_platform',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-env',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  redisQueueKey: process.env.REDIS_QUEUE_KEY || 'task_jobs',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200)
};
