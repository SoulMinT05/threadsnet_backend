const User = require('../models/UserModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

module.exports = {
    register,
    login,
    getDetailUser,
};
