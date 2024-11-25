const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const Friend = require('../models/FriendModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const createPost = asyncHandler(async (req, res) => {
    const { postedBy, text } = req.body;
    let { image } = req.body;
    if (!postedBy || (!text && !image)) throw new Error('Missing postedBy or text');

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

const getPostsByVisibility = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const currentUser = await User.findById(userId).populate('followers').populate('friends');

    const acceptedFriends = currentUser.friends.filter((friend) => friend.status === 'accepted');

    const friendIds = acceptedFriends.map((friend) =>
        friend.requester.toString() === userId ? friend.recipient : friend.requester,
    );
    const posts = await Post.find({
        $or: [
            { visibility: 'public' },
            {
                visibility: 'friends',
                postedBy: { $in: friendIds },
            },
            {
                visibility: 'followers',
                postedBy: { $in: currentUser.followers.map((follower) => follower._id) },
            },
            { visibility: 'private', postedBy: userId },
            { postedBy: userId },
        ],
    })
        .populate('postedBy', 'name username avatar')
        .sort({ createdAt: -1 });
    return res.status(200).json({
        posts,
    });
});

const updateVisibilityPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { visibility } = req.body;

    // Kiểm tra xem postId và visibility có được cung cấp hay không
    if (!postId || !visibility) {
        return res.status(400).json({
            success: false,
            message: 'Missing postId or visibility',
        });
    }

    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({
            success: false,
            message: 'Post not found',
        });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized to update this post',
        });
    }

    post.visibility = visibility;
    await post.save();
    return res.status(200).json({
        success: true,
        message: 'Visibility updated successfully',
        post,
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
    ).populate({
        path: 'comments',
        populate: {
            path: 'userId',
            select: 'name username email avatar createdAt updatedAt',
        },
    });
    if (!post) throw new Error('Get detail post failed');
    // return res.status(200).json({
    //     success: post ? true : false,
    //     post: post ? post : 'Get detail post failed',
    // });
    return res.status(200).json(post);
});

const getDetailPostFromAdmin = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) throw new Error('Post not found');

    const post = await Post.findByIdAndUpdate(
        postId,
        {
            $inc: { numberViews: 1 },
        },
        { new: true },
    )
        // .populate('postedBy')
        .populate({
            path: 'comments',
            populate: {
                path: 'userId',
                select: 'name username email avatar createdAt updatedAt',
            },
        });
    console.log('postDetail: ', post);
    if (!post) throw new Error('Get detail post failed');
    // return res.status(200).json({
    //     success: post ? true : false,
    //     post: post ? post : 'Get detail post failed',
    // });
    return res.status(200).json(post);
});

const getAllPosts = asyncHandler(async (req, res, next) => {
    const userIdToken = req.user._id;

    // Lấy danh sách các tài khoản bị chặn của người dùng hiện tại
    const loggedInUser = await User.findById(userIdToken);
    if (!loggedInUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    const blockedList = loggedInUser.blockedList;

    // Tìm tất cả các bài viết mà không phải của những người bị chặn
    const posts = await Post.find({ postedBy: { $nin: blockedList } })
        .sort({ createdAt: -1 })
        .populate({
            path: 'comments',
            populate: {
                path: 'userId',
                select: 'name username email avatar createdAt updatedAt',
            },
        });
    return res.status(200).json({
        success: posts ? true : false,
        posts: posts ? posts : 'Get all posts failed',
    });
});

const getAllPostsFromAdmin = asyncHandler(async (req, res, next) => {
    const userIdToken = req.user._id;

    // Lấy danh sách các tài khoản bị chặn của người dùng hiện tại
    const loggedInUser = await User.findById(userIdToken);
    if (!loggedInUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    const blockedList = loggedInUser.blockedList;

    // Tìm tất cả các bài viết mà không phải của những người bị chặn
    const posts = await Post.find({ postedBy: { $nin: blockedList } })
        .sort({ createdAt: -1 })
        .populate('postedBy')
        .populate({
            path: 'comments',
            populate: {
                path: 'userId',
                select: 'name username email avatar createdAt updatedAt',
            },
        });
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

    if (post.image) {
        const imageUrl = post.image; // e.g., 'https://res.cloudinary.com/.../threadsnet/imageName.jpg'
        const imagePath = imageUrl.split('/').slice(-2).join('/'); // 'threadsnet/imageName.jpg'
        const imageId = imagePath.split('.')[0]; // 'threadsnet/imageName'

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(imageId);
    }

    const deletePost = await Post.findByIdAndDelete(postId);
    return res.status(200).json({
        success: deletePost ? true : false,
        deletePost: deletePost ? deletePost : 'Delete post failed',
    });
});

const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { likes: userId },
            },
            { new: true },
        );
        await User.findByIdAndUpdate(
            userId,
            {
                $pull: { liked: postId },
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
                $push: { likes: userId },
            },
            { new: true },
        );
        await User.findByIdAndUpdate(
            userId,
            {
                $push: { liked: postId },
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

const savePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const userSavedPost = post.savedLists.includes(userId);

    if (userSavedPost) {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { savedLists: userId },
            },
            { new: true },
        );
        await User.findByIdAndUpdate(userId, {
            $pull: { saved: postId },
        });
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Unsaved post successfully' : 'Unsaved post failed',
            response: response ? response : 'Unsaved post failed',
        });
    } else {
        const response = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { savedLists: userId },
            },
            { new: true },
        );
        await User.findByIdAndUpdate(userId, {
            $push: { saved: postId },
        });
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

const getUserPosts = async (req, res) => {
    const { username } = req.params;
    const userId = req.user._id;
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found');

    let posts;

    // If postedBy of post equal :username
    if (user._id.toString() === userId.toString()) {
        // Trả về tất cả bài viết
        posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
    } else {
        // Nếu không phải người dùng hiện tại, chỉ trả về các bài viết công khai, bạn bè hoặc người theo dõi
        const currentUser = await User.findById(userId);

        const friends = await Friend.find({
            $or: [
                { requester: userId, recipient: user._id, status: 'accepted' },
                { requester: user._id, recipient: userId, status: 'accepted' },
            ],
        });

        const isFriend = friends.length > 0;
        const isFollower = currentUser.following.includes(user._id);

        // Lọc bài viết dựa trên quyền truy cập
        posts = await Post.find({
            postedBy: user._id,
            $or: [
                { visibility: 'public' },
                { visibility: 'friends', postedBy: isFriend ? user._id : null },
                { visibility: 'followers', postedBy: isFollower ? user._id : null },
            ],
        }).sort({ createdAt: -1 });
    }
    res.status(200).json({
        success: posts ? true : false,
        posts: posts ? posts : 'Get user posts failed',
    });
};

const getPublicPosts = asyncHandler(async (req, res) => {
    const publicPosts = await Post.find({ visibility: 'public' }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        publicPosts: publicPosts.length > 0 ? publicPosts : 'No public posts available',
    });
});

const getFollowingPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isFollowing = user.following;
    const followingPosts = await Post.find({
        postedBy: { $in: isFollowing },
        visibility: { $ne: 'private' }, // Lọc ra những bài có visibility là 'private'
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: followingPosts ? true : false,
        followingPosts: followingPosts ? followingPosts : 'Get feed posts failed',
    });
});

const getLikedPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const likedPostIds = user.liked;
    const likedPosts = await Post.find({
        _id: { $in: likedPostIds },
        $or: [
            { _id: { $in: likedPostIds }, visibility: { $ne: 'private' } },
            { postedBy: userId }, // Bao gồm bài viết của chính người dùng
        ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        likedPosts: likedPosts.length > 0 ? likedPosts : 'No liked posts found',
    });
});

const getSavedPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const savedPostIds = user.saved;
    const savedPosts = await Post.find({
        _id: { $in: savedPostIds },
        $or: [
            { _id: { $in: savedPostIds }, visibility: { $ne: 'private' } },
            { postedBy: userId }, // Bao gồm bài viết của chính người dùng
        ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        savedPosts: savedPosts.length > 0 ? savedPosts : 'No saved posts found',
    });
});

const getFriendPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get lists friends
    const friends = await Friend.find({
        $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' },
        ],
    });

    const friendIds = friends.map((friend) =>
        friend.requester.toString() === userId.toString() ? friend.recipient : friend.requester,
    );

    // Get lists posts of myself
    friendIds.push(userId);

    const friendPosts = await Post.find({
        postedBy: { $in: friendIds },
        visibility: 'friends',
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        friendPosts: friendPosts.length > 0 ? friendPosts : 'No friend posts available',
    });
});

module.exports = {
    createPost,
    getPostsByVisibility,
    updateVisibilityPost,
    getDetailPost,
    getDetailPostFromAdmin,
    getAllPosts,
    getAllPostsFromAdmin,
    updatePost,
    deletePost,
    likePost,
    // replyPost,
    savePost,
    repostPost,
    // updateReplyPost,
    // deleteReplyPost,
    getUserPosts,
    getPublicPosts,
    getFollowingPosts,
    getLikedPosts,
    getSavedPosts,
    getFriendPosts,
};
