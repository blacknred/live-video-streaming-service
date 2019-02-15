const http = require('http');
const socket = require('socket.io');
const debug = require('debug')('signaller');

const onConnection = require('./signaller');
const {
    init
} = require('./redis');

const PORT = process.env.PORT || 3000;

const server = http.createServer();

setImmediate(async () => {
    try {
        await init();
	await server.listen(PORT);
	debug(`🚀  at http://localhost:${PORT}`);
	const io = socket.listen(server, {
	    log: false,
	    origins: '*:*',
	    // path: '/signaling',
	});

	    // io.set('transports', [
	    //     'websocket',
	    //     'xhr-polling',
	    //     'jsonp-polling'
	    // ]);

	 io.sockets.on('connection', onConnection);
    } catch (e) {
        console.error(e);
    }
});
