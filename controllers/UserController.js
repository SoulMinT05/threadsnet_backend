const User = require('../models/UserModel');
const asyncHandler = require('express-async-handler');

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

const followUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const userToModify = await User.findById(userId);
    const currentUser = await User.findById(req.user._id);

    if (userId === req.user._id) throw new Error('You cannot follow/unfollow this user');
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

const updateInfoFromUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id || Object.keys(req.body).length === 0) throw new Error('You need to type at least one field to update ');
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
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true }).select(
        '-password -isAdmin -role -refreshToken',
    );
    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Update info user from admin failed',
    });
});

module.exports = {
    register,
    login,
    getDetailUser,
    refreshCreateNewAccessToken,
    logout,
    followUser,
    updateInfoFromUser,
    updateInfoFromAdmin,
};
