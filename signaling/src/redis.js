const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const OPTS = {
    port: 6379,
    host: 'redis',
    retry_strategy: opts => Math.max(opts.attempt * 100, 3000),
};

const client = redis.createClient(OPTS);
// const subscribers = {};

function init() {
    return new Promise((resolve, reject) => {

        client.auth(REDIS_PASSWORD);

        client.on('error', () => {
            reject('Redis Connection failed');
        });

        client.on('connect', () => {
            resolve(client);
        });

        client.on('log', async () => {
            const keys = await client.keysAsync('*');
            console.log(`\n ${keys.length} keys:`);
            keys.forEach(async (key) => {
                console.log(' %s - %s', key, await client.getAsync(key));
            });
        });
    });
}

// function addSubscriber(subscriber_key) {
//     var client = new Redis(OPTS);

//     client.subscribe(subscriber_key);
//     client.on('message', function(channel, message) {
//         io.emit(subscriber_key, JSON.parse(message));
//     });

//     redis_subscribers[subscriber_key] = client;
// }

module.exports = {
    init,
    client
};