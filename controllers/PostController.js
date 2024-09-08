const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const createPost = asyncHandler(async (req, res) => {
    const { postedBy, text } = req.body;
    let { image } = req.body;
    if (!postedBy || !text) throw new Error('Missing postedBy or text');

    const user = await User.findById(postedBy);
    if (!user) throw new Error('User not found');
    if (user._id.toString() !== req.user._id.toString())
        throw new Error('Unauthorized to create post because user._id !== req.user._id');

    const maxLength = 500;
    if (text.length > maxLength) throw new Error(`Text comment should be less than ${maxLength} words`);

    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: 'threadsnet',
        });
        console.log('Upload response: ', uploadResponse);
        image = uploadResponse.secure_url;
    }

    const newPost = await Post.create({
        ...req.body,
        image,
    });
    return res.status(200).json({
        success: newPost ? true : false,
        message: newPost ? 'Created post successfully' : 'Failed to create post',
        newPost,
    });
});

const getDetailPost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) throw new Error('Post not found');

    const post = await Post.findByIdAndUpdate(
        postId,
        {
            $inc: { numberViews: 1 },
        },
        { new: true },
    );
    return res.status(200).json({
        success: post ? true : false,
        post: post ? post : 'Get detail post failed',
    });
});

const getAllPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    return res.status(200).json({
        success: posts ? true : false,
        posts: posts ? posts : 'Get all posts failed',
    });
});

const updatePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) throw new Error(`Post ${postId} not found`);

    const post = await Post.findById(postId);
    if (post.postedBy.toString() !== req.user._id.toString()) throw new Error('Unauthorized to update post');

    if (Object.keys(req.body).length === 0) throw new Error('You must type at least one field to update');
    const updatePost = await Post.findByIdAndUpdate(postId, req.body, { new: true });
    return res.status(200).json({
        success: updatePost ? true : false,
        updatePost: updatePost ? updatePost : 'Update post failed',
    });
});

const deletePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) throw new Error(`Post ${postId} not found`);

    const post = await Post.findById(postId);
    if (post.postedBy.toString() !== req.user._id.toString()) throw new Error('Unauthorized to delete post');

    const deletePost = await Post.findByIdAndDelete(postId);
    return res.status(200).json({
        success: deletePost ? true : false,
        deletePost: deletePost ? deletePost : 'Delete post failed',
    });
});

const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { _id } = req.user;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const userLikedPost = post.likes.includes(_id);

    if (userLikedPost) {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { likes: _id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Unliked post successfully' : 'Unliked post failed',
            response: response ? response : 'Unliked post failed',
        });
    } else {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { likes: _id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Liked post successfully' : 'Liked post failed',
            response: response ? response : 'Liked post failed',
        });
    }
});

const replyPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const { textComment } = req.body;
    const { _id } = req.user;
    const userAvatar = req.user.userAvatar;
    const username = req.user.username;

    if (!textComment) throw new Error('Text comment field is required');

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const replyId = new mongoose.Types.ObjectId();
    const reply = {
        _id: replyId,
        userId: _id,
        textComment,
        userAvatar,
        username,
    };

    post.replies.push(reply);
    await post.save();

    return res.status(200).json({
        success: post ? true : false,
        post: post ? post : 'Reply post failed',
    });
});

const updateReplyPost = asyncHandler(async (req, res) => {
    const { postId, replyId } = req.params;
    const { textComment } = req.body;
    const userId = req.user._id;

    if (!textComment) throw new Error('Text comment field is required');

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const replyIndex = post.replies.findIndex((reply) => reply._id.toString() === replyId);
    if (replyIndex === -1) throw new Error('Reply not found');

    const reply = post.replies[replyIndex];
    console.log('reply :', reply);
    if (!reply || reply.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to edit this reply' });
    }

    post.replies[replyIndex].textComment = textComment;
    await post.save();
    return res.status(200).json({
        success: true,
        message: 'Reply updated successfully',
        post: post,
    });
});

const deleteReplyPost = asyncHandler(async (req, res) => {
    const { postId, replyId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const replyIndex = post.replies.findIndex((reply) => reply._id.toString() === replyId);
    if (replyIndex === -1) {
        return res.status(404).json({ message: 'Reply not found' });
    }

    const reply = post.replies[replyIndex];
    if (!reply || reply.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to delete this reply' });
    }

    post.replies.splice(replyIndex, 1); //Delete position replyIndex with 1 element
    await post.save();

    return res.status(200).json({
        success: true,
        message: 'Reply deleted successfully',
        post: post,
    });
});
const savePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { _id } = req.user;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const userLikedPost = post.savedLists.includes(_id);

    if (userLikedPost) {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { savedLists: _id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Unsaved post successfully' : 'Unsaved post failed',
            response: response ? response : 'Unsaved post failed',
        });
    } else {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { savedLists: _id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Saved post successfully' : 'Saved post failed',
            response: response ? response : 'Saved post failed',
        });
    }
});

const repostPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
        return res.status(404).send('Post not found');
    }
    const post = await Post.findByIdAndUpdate(
        postId,
        {
            $inc: { numberViewsRepost: 1 },
        },
        { new: true },
    );

    return res.status(200).json({
        success: post ? true : false,
        message: post ? 'Reposted post successfully' : 'Unreposted post failed',
        post: post ? post : 'Unreposted post failed',
    });
});

const getFollowingPosts = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) throw new Error('User not found');

    const isFollowing = user.following;
    const followingPosts = await Post.find({ postedBy: { $in: isFollowing } }).sort({ createdAt: -1 });
    res.status(200).json({
        success: followingPosts ? true : false,
        followingPosts: followingPosts ? followingPosts : 'Get feed posts failed',
    });
});

const getUserPosts = async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) throw new Error(`User not found`);

    const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
    res.status(200).json({
        success: posts ? true : false,
        posts: posts ? posts : 'Get user posts failed',
    });
};

module.exports = {
    createPost,
    getDetailPost,
    getAllPosts,
    updatePost,
    deletePost,
    likePost,
    replyPost,
    savePost,
    repostPost,
    updateReplyPost,
    deleteReplyPost,
    getFollowingPosts,
    getUserPosts,
};
