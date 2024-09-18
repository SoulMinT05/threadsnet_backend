const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        recipient: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Friend', FriendSchema);
