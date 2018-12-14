const Koa = require('koa');
// const path = require('path');
const cors = require('kcors');
// const serve = require('koa-static');
const helmet = require('koa-helmet');
const logger = require('koa-logger');

const routes = require('./routes');

const app = new Koa();

/* Logs, Cors, Prevent bruteforce, Body, multipart */
app.use(logger());
app.use(cors()); // { origin: 'http://localhost:5000'}
app.use(helmet());

// /* Serve static files */
// app.use(serve(path.join(__dirname, '../node_modules')));
// app.use(serve(path.join(__dirname, '/public')));

/* Errors */
app.use(async (ctx, next) => {
    try {
        console.log('llll');
        await next();
        const status = ctx.status || 404;
        if (status === 404) ctx.throw(404, 'File Not Found');
    } catch (err) {
        console.log(err);
        ctx.status = err.status || 500;
        ctx.body = {
            status: 'error',
            message: err.message
        };
    }
});

// Router
app.use(routes.routes());

module.exports = app;


// var app = require('http').createServer(function (request, response) {
//     var uri = require('url').parse(request.url).pathname,
//         filename = path.join(process.cwd(), uri);

//     var isWin = !!process.platform.match(/^win/);

//     if (fs.statSync(filename).isDirectory()) {
//         if (!isWin) filename += '/index.html';
//         else filename += '\\index.html';
//     }

//     fs.exists(filename, function (exists) {
//         if (!exists) {
//             response.writeHead(404, {
//                 "Content-Type": "text/plain"
//             });
//             response.write('404 Not Found: ' + filename + '\n');
//             response.end();
//             return;
//         }

//         fs.readFile(filename, 'binary', function (err, file) {
//             if (err) {
//                 response.writeHead(500, {
//                     "Content-Type": "text/plain"
//                 });
//                 response.write(err + "\n");
//                 response.end();
//                 return;
//             }

//             response.writeHead(200);
//             response.write(file, 'binary');
//             response.end();
//         });
//     });
// });
