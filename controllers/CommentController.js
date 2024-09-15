const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const Comment = require('../models/CommentModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const createComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const userId = req.user._id;
    const { textComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const avatar = user.avatar;
    const username = user.username;

    const newComment = await Comment.create({
        textComment,
        userId,
        postId,
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
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error(`Comment ${commentId} not found`);

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (userId !== comment.userId.toString()) throw new Error('You can only update your comment');

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

    if (userId !== comment.userId.toString()) throw new Error('You can only update your comment');

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

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const userId = req.user._id;
    if (userId !== comment.userId.toString()) throw new Error('You can only delete your comment');

    await Post.findOneAndUpdate(
        {
            comments: commentId,
        },
        { $pull: { comments: commentId } },
        {
            new: true,
        },
    );
    await comment.deleteOne();
    return res.status(200).json({
        success: comment ? true : false,
        comment: comment ? comment : 'Delete comment failed',
    });
});

const deleteReply = asyncHandler(async (req, res) => {
    const { commentId, replyId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const userId = req.user._id;
    if (userId !== comment.userId.toString()) throw new Error('You can only delete your reply');

    comment.replies = comment.replies.filter((reply) => reply._id.toString() !== replyId);

    await comment.save();
    return res.status(200).json({
        success: comment ? true : false,
        comment: comment ? comment : 'Delete reply failed',
    });
});

const likeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    const userLikedReply = comment.likes.includes(userId);

    if (userLikedReply) {
        const response = await Comment.findByIdAndUpdate(
            commentId,
            {
                $pull: { likes: userId },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Unliked comment successfully' : 'Unliked comment failed',
            response: response ? response : 'Unliked comment failed',
        });
    } else {
        const response = await Comment.findByIdAndUpdate(
            commentId,
            {
                $push: { likes: userId },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Liked comment successfully' : 'Liked comment failed',
            response: response ? response : 'Liked comment failed',
        });
    }
});

const likeReply = asyncHandler(async (req, res) => {
    const { commentId, replyId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const userId = req.user._id;
    const replyComment = comment.replies.id(replyId); //find id of replies, but it's same with replyId
    if (!replyComment) throw new Error('Reply not found');

    const userLikedReply = replyComment.likes.includes(userId);
    if (userLikedReply) {
        const response = await Comment.findOneAndUpdate(
            { _id: commentId, 'replies._id': replyComment._id },
            {
                $pull: { 'replies.$.likes': userId },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Unliked reply successfully' : 'Unliked reply failed',
            response: response ? response : 'Unliked reply failed',
        });
    } else {
        const response = await Comment.findOneAndUpdate(
            { _id: commentId, 'replies._id': replyComment._id },
            {
                $push: { 'replies.$.likes': userId },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Liked reply successfully' : 'Liked reply failed',
            response: response ? response : 'Liked reply failed',
        });
    }
});

module.exports = {
    createComment,
    updateComment,
    createReply,
    updateReply,
    getAllCommentsInPost,
    deleteComment,
    deleteReply,
    likeComment,
    likeReply,
};
