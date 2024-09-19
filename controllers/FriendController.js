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

    // status: pending, or rejected
    if (existingFriendship) {
        // Nếu yêu cầu đã bị từ chối trước đó, cho phép gửi lại
        if (existingFriendship.status === 'rejected') {
            existingFriendship.status = 'pending';
            await existingFriendship.save();

            await User.findByIdAndUpdate(
                requesterId,
                { $addToSet: { following: recipientId } }, // $addToSet để đảm bảo không trùng
                { new: true },
            );

            await User.findByIdAndUpdate(
                recipientId,
                { $addToSet: { followers: requesterId } }, // $addToSet để đảm bảo không trùng
                { new: true },
            );
            const updatedFriendship = await Friend.findById(existingFriendship._id)
                .populate('requester', 'name username avatar')
                .populate('recipient', 'name username avatar')
                .exec();

            if (updatedFriendship.status !== 'pending') {
                throw new Error('Friend request already exists or you are already friends.');
            }

            return res.status(200).json({
                message: 'Friend request resent successfully',
                updatedFriendship,
            });
        }
        // Nếu yêu cầu vẫn đang chờ hoặc đã được chấp nhận, không cho phép gửi lại
        throw new Error('Friend request already exists or you are already friends.');
    }

    const newFriendship = await Friend.create({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending',
    });

    await User.findByIdAndUpdate(
        requesterId,
        {
            $push: { friends: newFriendship._id, following: recipientId },
        },
        { new: true },
    );

    await User.findByIdAndUpdate(
        recipientId,
        {
            $push: { friends: newFriendship._id, followers: requesterId },
        },
        { new: true },
    );

    const populatedFriendship = await Friend.findById(newFriendship._id)
        .populate('requester', 'name username avatar')
        .populate('recipient', 'name username avatar');

    return res.status(200).json({
        message: populatedFriendship ? 'Send request add friend successfully' : 'Send request add friend failed',
        populatedFriendship: populatedFriendship ? populatedFriendship : '',
    });
});

const acceptFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id;

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

    res.status(200).json({
        success: friendRequest ? true : false,
        message: friendRequest ? 'Accept friend successfully' : 'Accept friend failed',
        friendRequest,
    });
});

const rejectFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findOne({
        _id: requestId,
        recipient: userId,
        status: 'pending',
    });

    if (!friendRequest) {
        return res.status(404).json({ message: 'Friend request not found or already accepted/rejected' });
    }
    friendRequest.status = 'rejected';
    await friendRequest.save();

    await User.findByIdAndUpdate(
        friendRequest.requester,
        { $pull: { following: friendRequest.recipient } },
        { new: true },
    );

    await User.findByIdAndUpdate(
        friendRequest.recipient,
        { $pull: { followers: friendRequest.requester } },
        { new: true },
    );

    res.status(200).json({
        success: friendRequest ? true : false,
        message: friendRequest ? 'Reject friend successfully' : 'Reject friend failed',
        friendRequest,
    });
});

const getFriendsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const userFriend = await User.findById(userId).populate({
        path: 'friends',
        match: { status: 'accepted' },
        populate: [
            { path: 'requester', select: '-refreshToken -password -role -isAdmin -createdAt -updatedAt -isBlocked' },
            { path: 'recipient', select: '-refreshToken -password -role -isAdmin -createdAt -updatedAt -isBlocked' },
        ],
    });

    res.status(200).json({ success: true, message: 'Get friends by user successfully', userFriend });
});

const unfriend = asyncHandler(async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user._id;

    const friendShip = await Friend.findOne({
        $or: [
            { requester: userId, recipient: friendId, status: 'accepted' },
            { requester: friendId, recipient: userId, status: 'accepted' },
        ],
    });
    if (!friendShip) throw new Error('Friendship not found or already unfriended');
    await Friend.findByIdAndDelete(friendShip._id);

    await User.findByIdAndUpdate(
        friendId,
        {
            $pull: { friends: friendShip._id },
        },
        { new: true },
    );

    await User.findByIdAndUpdate(
        userId,
        {
            $pull: { friends: friendShip._id },
        },
        { new: true },
    );

    await User.findByIdAndUpdate(friendId, { $pull: { followers: userId, following: userId } }, { new: true });
    await User.findByIdAndUpdate(userId, { $pull: { followers: friendId, following: friendId } }, { new: true });

    return res.status(200).json({
        success: true,
        message: 'Unfriend successfully',
        friendShip,
    });
});

module.exports = {
    addFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendsByUser,
    unfriend,
};
