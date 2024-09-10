const mongoose = require('mongoose');

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
            default: 'https://wallpapers.com/images/hd/work-desk-blogging-backdrop-ij7yb6kjl1y3kmg1.jpg',
            // required: true,
        },
        numberViews: {
            type: Number,
            default: 0,
        },
        numberViewsRepost: {
            // Chuyển numberViewsRepost ra ngoài
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
        replies: [
            {
                _id: mongoose.Schema.Types.ObjectId,
                userId: {
                    type: mongoose.Types.ObjectId,
                    ref: 'User',
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
