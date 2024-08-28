const User = require('../models/UserModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

module.exports = {
    register,
};
