const Redis = require('redis');

const redisClient = Redis.createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

const connectRedis = async () => {
  await redisClient.connect();
};

connectRedis();

module.exports = redisClient; 