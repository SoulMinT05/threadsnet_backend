const User = require('../models/UserModel');
const Friend = require('../models/FriendModel');
const asyncHandler = require('express-async-handler');

const addFriendRequest = asyncHandler(async (req, res) => {
    const requesterId = req.user._id;
    const recipientId = req.params.userId;

    // Check if existing friend is already
    const existingFriendship = await Friend.findOne({
        $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId },
        ],
    });
    if (existingFriendship) {
        return res.status(400).json({ message: 'Friend request already exists or you are already friends.' });
    }

    const newFriendship = await Friend.create({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending',
    });

    await User.findByIdAndUpdate(requesterId, {
        $push: { friends: newFriendship._id },
    });

    await User.findByIdAndUpdate(recipientId, {
        $push: { friends: newFriendship._id },
    });

    const populatedFriendship = await Friend.findById(newFriendship._id)
        .populate('requester', 'name username avatar')
        .populate('recipient', 'name username avatar');

    // const populatedRequester = await User.findById(requesterId).populate({
    //     path: 'friends',
    //     populate: [
    //         { path: 'requester', select: 'name username avatar' },
    //         { path: 'recipient', select: 'name username avatar' },
    //     ],
    // });

    // const populatedRecipient = await User.findById(recipientId).populate({
    //     path: 'friends',
    //     populate: [
    //         { path: 'requester', select: 'name username avatar' },
    //         { path: 'recipient', select: 'name username avatar' },
    //     ],
    // });

    return res.status(200).json({
        message: populatedFriendship ? 'Send request add friend successfully' : 'Send request add friend failed',
        populatedFriendship: populatedFriendship ? populatedFriendship : '',
    });
});

const acceptFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params; // ID của lời mời kết bạn (FriendModel)
    const userId = req.user._id; // ID của người dùng hiện tại (người nhận yêu cầu)

    // Tìm lời mời kết bạn và kiểm tra trạng thái
    const friendRequest = await Friend.findOne({
        _id: requestId,
        recipient: userId,
        status: 'pending',
    });

    if (!friendRequest) {
        return res.status(404).json({ message: 'Friend request not found or already accepted/rejected' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();
    console.log('friendRequest: ', friendRequest);

    res.status(200).json({
        success: friendRequest ? true : false,
        message: friendRequest ? 'Accept friend successfully' : 'Accept friend failed',
        friendRequest,
    });
});

module.exports = {
    addFriendRequest,
    acceptFriendRequest,
};
