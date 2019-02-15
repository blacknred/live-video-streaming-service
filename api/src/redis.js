import redis from 'redis';
import bluebird from 'bluebird';

const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const client = redis.createClient({
    port: 6379,
    host: 'redis',
    retry_strategy: options => Math.max(options.attempt * 100, 3000),
});
client.auth(REDIS_PASSWORD);
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

export default client;