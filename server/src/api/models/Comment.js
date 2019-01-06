const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    bradcastId: {
        type: Number,
        required: true,
        index: true
    },
    userId: {
        type: Number,
        required: true,
    },
    text: String,
    event: {
        type: Number,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
    // services: {
    //     type: Map,
    //     of: String
    // }
});

module.exports = mongoose.model('Comment', commentSchema);