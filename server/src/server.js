const http = require('http');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app.callback());

server.config = require('./config') || {};

require('./broadcasting/signalingServer')(server);

server.listen(PORT, () => console.log(`Listening on port ${PORT}!`));