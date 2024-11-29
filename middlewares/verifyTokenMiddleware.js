const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');

const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No authorization token provided',
        });
    }
    if (req?.headers?.authorization.startsWith('Bearer')) {
        const accessToken = token.split(' ')[1];
        jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid access token',
                });
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Not verify access token. Require authentication',
        });
    }
});

const checkIsStaff = asyncHandler(async (req, res, next) => {
    const { isAdmin, role } = req.user;
    if (role !== 'staff') {
        res.status(401).json({
            success: false,
            message: 'Require admin role',
        });
    }
    next();
});

const checkIsAdmin = asyncHandler(async (req, res, next) => {
    const { isAdmin, role } = req.user;
    if (isAdmin === false && role !== 'admin') {
        res.status(401).json({
            success: false,
            message: 'Require admin role',
        });
    }
    if (isAdmin === true || role === 'admin') next();
});

const checkAdminOrStaff = (req, res, next) => {
    const { role } = req.user;

    if (role === 'admin' || role === 'staff') {
        next();
    } else {
        // Nếu không phải, trả về thông báo truy cập bị từ chối
        return res.status(403).json({ message: 'Bạn không có quyền để truy cập vào.' });
    }
};

const checkBlockedUser = asyncHandler(async (req, res, next) => {
    const userId = req.params.query; //user in params
    const loggedInUser = await User.findById(req.user._id); //user logged in

    if (loggedInUser.blockedList.includes(userId)) {
        return res.status(403).json({
            success: false,
            message: 'You cannot access this user profile as they are blocked.',
        });
    }

    next();
});

module.exports = { verifyAccessToken, checkIsStaff, checkIsAdmin, checkAdminOrStaff, checkBlockedUser };
