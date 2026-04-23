const env = require("../config/env");
const { createRedisClient } = require("../config/redis");

const redis = createRedisClient();

async function pushTaskJob(taskId) {
  const payload = JSON.stringify({ taskId });
  await redis.lpush(env.redisQueueKey, payload);
}

module.exports = { pushTaskJob };
