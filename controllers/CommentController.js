const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const Comment = require('../models/CommentModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const createComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // const { userId, textComment } = req.body;
    const userId = req.user._id;
    const { textComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const avatar = user.avatar;
    const username = user.username;

    const newComment = await Comment.create({
        ...req.body,
        avatar,
        username,
    });
    post.comments.push(newComment._id);
    await post.save();

    return res.status(200).json({
        success: newComment ? true : false,
        newComment: newComment ? newComment : 'Create new comment failed',
    });
});

const createReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { textComment } = req.body;
    const userId = req.user._id;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) throw new Error(`Parent comment ${commentId} not found`);

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const avatar = user.avatar;
    const username = user.username;

    const reply = {
        textComment,
        userId,
        avatar,
        username,
    };
    parentComment.replies.push(reply);
    await parentComment.save();

    return res.status(200).json({
        success: parentComment ? true : false,
        parentComment: parentComment ? parentComment : 'Create reply failed',
    });
});

module.exports = {
    createComment,
    createReply,
};
