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

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { textComment } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error(`Comment ${commentId} not found`);

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            textComment,
        },
        { new: true },
    );
    return res.status(200).json({
        success: updatedComment ? true : false,
        updatedComment: updatedComment ? updatedComment : 'Update comment failed',
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
const updateReply = asyncHandler(async (req, res) => {
    const { commentId, replyId } = req.params;
    const { textComment } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error(`Comment ${commentId} not found`);

    const replyIndex = comment.replies.findIndex((reply) => reply._id.toString() === replyId);
    if (replyIndex === -1) throw new Error(`Reply not found`);

    if (comment.replies[replyIndex].userId.toString() !== userId) throw new Error('You can only update your reply');

    comment.replies[replyIndex].textComment = textComment;
    await comment.save();
    return res.status(200).json({
        success: true,
        comment,
        message: 'Update reply successfully',
    });
});

// Get all comments in any post
const populateUserDetails = asyncHandler(async (comments) => {
    for (const comment of comments) {
        await comment.populate('userId', 'username name avatar');
        if (comment.replies.length > 0) {
            await comment.populate('replies.userId', 'username name avatar');
        }
    }
});
const getAllCommentsInPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    let comments = await Comment.find({ postId });
    await populateUserDetails(comments);

    return res.status(200).json({
        success: comments ? true : false,
        comments: comments ? comments : 'Get comment in post failed',
    });
});

module.exports = {
    createComment,
    updateComment,
    createReply,
    updateReply,
    getAllCommentsInPost,
};
