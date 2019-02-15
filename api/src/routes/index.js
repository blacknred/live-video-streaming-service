const Router = require('koa-router');

const commentControllers = require('../controllers/comment');

const router = new Router({ prefix: '/api' });

router
    .get('/ping', ctx => ctx.body = 'pong')
    .get('/:streamId/comments', commentControllers.getComments)
    .post('/:streamId/comment', commentControllers.addComment);

module.exports = router;