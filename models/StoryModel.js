const mongoose = require('mongoose');
const CommentSchema = require('./CommentModel');

const StorySchema = new mongoose.Schema(
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
        likes: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ],
        comments: [CommentSchema],
    },
    {
        // _id: false,
        timestamps: true,
    },
);

//Export the model
module.exports = mongoose.model('Story', StorySchema);
