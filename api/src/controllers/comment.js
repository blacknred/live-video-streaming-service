const Comment = require('../models/Comment');

// Get all comments
exports.getComments = async (ctx) => {
    try {
        const { broadcastId } = ctx.request.params;
        const comments = await Comment.find({ broadcastId });
        ctx.body = comments;
    } catch (err) {
        // throw boom.boomify(err);
    }
};

// Add a new comment
exports.addComment = async (ctx) => {
    try {
        const { broadcastId } = ctx.request.params;
        const comment = new Comment({ ...ctx.request.body, broadcastId });
        comment.save();
        ctx.body = comment;
    } catch (err) {
        // throw boom.boomify(err);
    }
};

// const update = await Comment.findByIdAndUpdate(id, updateData, {
//     new: true
// return update
// })
// const comment = await Comment.findByIdAndRemove(id)
// return comment