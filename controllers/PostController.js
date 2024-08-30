const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const asyncHandler = require('express-async-handler');

const createPost = asyncHandler(async (req, res) => {
    const { postedBy, text, image } = req.body;
    if (!postedBy || !text) throw new Error('Missing postedBy or text');

    const user = await User.findById(postedBy);
    if (!user) throw new Error('User not found');
    if (user._id.toString() !== req.user._id.toString())
        throw new Error('Unauthorized to create post because user._id !== req.user._id');

    const maxLength = 500;
    if (text.length > maxLength) throw new Error(`Text should be less than ${maxLength} words`);

    const newPost = await Post.create(req.body);
    return res.status(200).json({
        success: newPost ? true : false,
        message: newPost ? 'Created post successfully' : 'Failed to create post',
        newPost,
    });
});

module.exports = {
    createPost,
};
