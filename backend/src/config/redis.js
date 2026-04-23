const Redis = require("ioredis");
const env = require("./env");

function createRedisClient() {
  return new Redis({
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
  });
}

module.exports = { createRedisClient };
