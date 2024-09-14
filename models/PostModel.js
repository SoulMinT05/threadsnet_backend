const mongoose = require('mongoose');
const CommentSchema = require('./CommentModel');

const PostSchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
        },
        text: {
            type: String,
        },
        image: {
            type: String,
            default: '',
        },
        numberViews: {
            type: Number,
            default: 0,
        },
        numberViewsRepost: {
            type: Number,
            default: 0,
        },
        likes: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ],
        // replies: [
        //     {
        //         _id: mongoose.Schema.Types.ObjectId,
        //         userId: {
        //             type: mongoose.Types.ObjectId,
        //             ref: 'User',
        //         },
        //         textComment: {
        //             type: String,
        //         },
        //         avatar: {
        //             type: String,
        //         },
        //         username: {
        //             type: String,
        //         },
        //     },
        // ],
        // comments: [CommentSchema],
        comments: [
            {
                type: mongoose.Types.ObjectId, // Dùng ObjectId để tham chiếu đến Comment
                ref: 'Comment', // Tham chiếu tới model Comment
            },
        ],
        savedLists: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ],
        originalPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            // numberViewsRepost: {
            //     type: Number,
            //     default: 0,
            // },
        },
        lastRepostedAt: {
            type: Date,
        },
    },
    {
        // _id: false,
        timestamps: true,
    },
);

//Export the model
module.exports = mongoose.model('Post', PostSchema);
