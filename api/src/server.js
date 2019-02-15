const http = require('http');
const mongoose = require('mongoose');
const debug = require('debug')('server');

const app = require('./app');

const DB_URI = process.env.NODE_ENV !== 'test' ?
    process.env.DATABASE_URL : process.env.DATABASE_URL_TEST;

const PORT = process.env.PORT || 3000;

const server = http.createServer(app.callback());

// Connect to DB
mongoose.connect(DB_URI)
    .then(() => server.listen(PORT, () => {
        debug(`🚀  on port ${PORT}!`);
    }))
    .catch(err => debug(err));