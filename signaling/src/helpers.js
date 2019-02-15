const {
    client
} = require('./redis');

module.exports = function () {
    client.set('users', 1, client.print);
    client.set('userss', 2, 'EX', 15);

    // client.subscribe('kkk');
    // client.publish('kkk', 'uuuuuuuukuuuu');


    client.emit('log');
};