const Router = require('koa-router');

const router = new Router(); // { prefix: 'v1' }

// ctx.req.setTimeout(Number.MAX_VALUE);

router

    .get('/ping', ctx => ctx.body = 'pong');

module.exports = router;