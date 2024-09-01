const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sendMail = require('../utils/sendMail');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwtMiddleware');

const register = asyncHandler(async (req, res, next) => {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) throw new Error('Missing input register');
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
        throw new Error(`User with username ${username} and email ${email} has already existed`);
    } else {
        const newUser = await User.create(req.body);
        console.log('newUser: ', newUser);
        return res.status(200).json({
            success: newUser ? true : false,
            newUser: newUser ? newUser : 'Register account failed',
        });
    }
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing input login',
        });
    }
    const user = await User.findOne({ email });
    if (user.isBlocked) throw new Error(`User with email ${user.email} is blocked`);

    if (user && (await user.isCorrectPassword(password))) {
        const { password, isAdmin, role, refreshToken, ...userData } = user._doc;
        // Add accessToken, refreshToken
        const accessToken = generateAccessToken(userData._id, isAdmin, role);
        const newRefreshToken = generateRefreshToken(userData._id);
        // Save refreshToken to DB
        await User.findByIdAndUpdate(userData._id, { refreshToken: newRefreshToken }, { new: true });
        // Save refreshToken to cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, //time expires in seconds
        });

        return res.status(200).json({
            success: true,
            message: 'Login successfully',
            accessToken,
            userData,
        });
    } else {
        throw new Error('Error in email and password when logging in!');
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { block } = req.body;

    if (!block) throw new Error('You must select a block true or false');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found!');

    user.isBlocked = block;
    await user.save();
    return res.status(200).json({
        success: user.isBlocked ? true : false,
        message: user.isBlocked ? 'Block user successfully' : 'Unblock user successfully',
        user,
    });
});

const getDetailUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    console.log('req.user: ', req.user);
    const user = await User.findById(_id);
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Get detail user failed',
    });
});

const refreshCreateNewAccessToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie && !cookie.refreshToken) throw new Error('No refresh token in cookies');

    // If isCheckRefreshToken error => it stops and returns immediately
    const isCheckRefreshToken = await jwt.verify(cookie.refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: isCheckRefreshToken._id, refreshToken: cookie.refreshToken });
    return res.status(200).json({
        success: user ? true : false,
        newAccessToken: user ? generateAccessToken(user._id, user.isAdmin, user.role) : 'Refresh token not matched',
    });
});

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie || !cookie.refreshToken) throw new Error('Not found refresh token in cookies');
    // Delete refreshToken in DB
    await User.findOneAndUpdate(
        { refreshToken: cookie.refreshToken },
        {
            refreshToken: '',
        },
        { new: true },
    );
    // Delete refreshToken in cookies
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
    });
    return res.status(200).json({
        success: true,
        message: 'Logout successfully',
    });
});

// Client send mail
// Server check mail is valid? => send mail + with link (password change token)
// Client check mail => click link
// Client send api with token
// Check token is same with token of server send mail?
// Change password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email) throw new Error('Email not found');
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const resetToken = user.createPasswordChangeToken();
    await user.save();

    const html = `
        Vui lòng nhấp vào link dưới đây để thay đổi mật khẩu của bạn. 
        Link này sẽ hết hạn sau 5 phút kể từ bây giờ. <a href=${process.env.URI_SERVER}/api/user/resetPassword/${resetToken}>Nhấp vào đây</a>
    `;

    const data = {
        email,
        html,
    };
    const infoMailUser = await sendMail(data);
    return res.status(200).json({
        success: true,
        infoMailUser,
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body;
    if (!password || !token) throw new Error('Missing password or token');
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    // gt: higher than, lt: lower than
    const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) throw new Error('Invalid reset token');
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();
    return res.status(200).json({
        success: user ? true : false,
        message: user ? 'Updated password successfully' : 'Failed update password',
    });
});

const followUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const userToModify = await User.findById(userId);
    const currentUser = await User.findById(req.user._id);

    if (userId === req.user._id) throw new Error('You cannot follow/unfollow yourself');

    if (!userToModify || !currentUser) throw new Error('User not found');
    const isFollowing = currentUser.following.includes(userId);
    if (isFollowing) {
        // Unfollow
        // Modify currentUser following, modify followers of userToModify
        const responseFollowing = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { following: userId },
            },
            { new: true },
        );
        const responseFollower = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { followers: req.user._id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: responseFollowing && responseFollower ? true : false,
            message: 'Unfollow user',
            responseFollowing,
            responseFollower,
        });
    } else {
        const responseFollowing = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { following: userId },
            },
            { new: true },
        );
        const responseFollower = await User.findByIdAndUpdate(
            userId,
            {
                $push: { followers: req.user._id },
            },
            { new: true },
        );
        return res.status(200).json({
            success: responseFollowing && responseFollower ? true : false,
            message: 'Follow user',
            responseFollowing,
            responseFollower,
        });
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    const user = await User.find().select('-password -isAdmin -role -refreshToken');
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Get all users failed',
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        throw new Error('User not found');
    }
    const user = await User.findByIdAndDelete(userId);
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Delete user failed',
    });
});

const updateInfoFromUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id || Object.keys(req.body).length === 0) throw new Error('You need to type at least one field to update ');
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findByIdAndUpdate(_id, req.body, { new: true }).select(
        '-password -isAdmin -role -refreshToken',
    );
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Update info user failed',
    });
});

const updateInfoFromAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (Object.keys(req.body).length === 0) throw new Error('You need to type at least one field to update ');
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true }).select(
        '-password -isAdmin -role -refreshToken',
    );
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Update info user from admin failed',
    });
});

const createUserFromAdmin = asyncHandler(async (req, res) => {
    const { name, email, username, password } = req.body;
    const passwordUser = password || '123';
    if (!name || !email || !username) throw new Error('Missing input create user from admin');
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
        throw new Error(`User with username ${username} and email ${email} has already existed`);
    } else {
        const newUser = await User.create({ ...req.body, password: passwordUser });
        return res.status(200).json({
            success: newUser ? true : false,
            newUser: newUser ? newUser : 'Create user account from admin failed',
        });
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password -updatedAt');
    if (!user) throw new Error(`User ${username} not found`);
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Get user profile failed',
    });
});

module.exports = {
    register,
    login,
    blockUser,
    getDetailUser,
    refreshCreateNewAccessToken,
    forgotPassword,
    resetPassword,
    logout,
    followUser,
    getAllUsers,
    deleteUser,
    updateInfoFromUser,
    updateInfoFromAdmin,
    createUserFromAdmin,
    getUserProfile,
};
