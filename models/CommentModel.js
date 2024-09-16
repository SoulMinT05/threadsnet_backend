const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
        },
        postId: {
            type: mongoose.Types.ObjectId,
            ref: 'Post',
        },
        textComment: {
            type: String,
        },
        avatar: {
            type: String,
        },
        username: {
            type: String,
        },
        likes: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
            },
        ],
        replies: [
            {
                userId: {
                    type: mongoose.Types.ObjectId,
                    ref: 'User',
                },
                avatar: {
                    type: String,
                },
                username: {
                    type: String,
                },
                textComment: {
                    type: String,
                },
                likes: [
                    {
                        type: mongoose.Types.ObjectId,
                        ref: 'User',
                    },
                ],
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Comment', CommentSchema);
