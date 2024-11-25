const User = require('../models/UserModel');
const Post = require('../models/PostModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sendMail = require('../utils/sendMail');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwtMiddleware');
const { default: mongoose } = require('mongoose');

const cloudinary = require('cloudinary').v2;

const register = asyncHandler(async (req, res, next) => {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) throw new Error('Missing input register');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password))
        throw new Error(
            'Password must be at least 8 characters long, contain one letter, one number, and one special character',
        );

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
        throw new Error(`User with username ${username} and email ${email} has already existed`);
    } else {
        const newUser = await User.create(req.body);
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
    const user = await User.findOne({ email })
        .populate('blockedList', '-password -refreshToken')
        .populate('liked', '-password -refreshToken')
        .populate('saved', '-password -refreshToken');

    if (user.isLocked) throw new Error(`User with email ${user.email} is locked`);
    console.log('user.isLocked: ', user.isLocked);

    if (user && (await user.isCorrectPassword(password))) {
        const { password, isAdmin, role, refreshToken, isLocked, ...userData } = user._doc;
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
            userData: {
                ...userData,
                isAdmin, // Adding isAdmin back to the userData
                role,
                isLocked,
            },
        });
    } else {
        throw new Error('Error in email and password when logging in!');
    }
});

const lockedUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUser = req.user;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found!');

    // Kiểm tra nếu admin cố gắng khóa tài khoản của chính mình
    if (currentUser._id === userId) {
        return res.status(403).json({
            success: false,
            message: 'Không được khoá/mở khoá chính mình.',
        });
    }
    if (currentUser.role === user.role) {
        return res.status(403).json({
            success: false,
            message: 'Không được khoá/mở khoá người cùng chức vụ.',
        });
    }

    if (currentUser.role === 'staff' && user.role === 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Nhân viên không được khoá/mở khoá quản lý.',
        });
    }

    user.isLocked = !user.isLocked;
    await user.save();
    return res.status(200).json({
        success: true,
        message: user.isLocked ? 'Khoá tài khoản thành công' : 'Mở khoá tài khoản thành công',
        user,
    });
});

const getDetailUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
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
    // if (!cookie || !cookie.refreshToken) throw new Error('Not found refresh token in cookies');
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

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!newPassword || !currentPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
    }

    // Check the current password
    const isMatchPassword = await user.isCorrectPassword(currentPassword);
    if (!isMatchPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword))
        throw new Error('Mật khẩu phải gồm kí tự in hoa, kí tự thường, số và kí tự đặc biệt');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        {
            password: hashedPassword,
            passwordChangedAt: Date.now(),
        },
        { new: true },
    );

    return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        user: updatedUser,
    });
});

// Client send mail
// Server check mail is valid? => send mail + with link (password change token)
// Client check mail => click link
// Client send api with token
// Check token is same with token of server send mail?
// Change password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new Error('Email not found');
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const resetToken = user.createPasswordChangeToken();
    await user.save();

    const html = `
        Vui lòng nhấp vào link dưới đây để thay đổi mật khẩu của bạn. 
        Link này sẽ hết hạn sau 5 phút kể từ bây giờ. <a href=${process.env.URI_CLIENT}/resetPassword/${resetToken}>Nhấp vào đây</a>
    `;

    const data = {
        email,
        html,
    };
    const infoMailUser = await sendMail(data);
    return res.status(200).json({
        success: infoMailUser?.response?.includes('OK') ? true : false,
        message: infoMailUser?.response?.includes('OK') ? 'Check mail to do a next step' : 'Error, please try again',
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body;
    if (!password || !token) throw new Error('Missing password or token');
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    // gt: higher than, lt: lower than
    const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) throw new Error('Invalid reset token. Please try again forgot password');
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();
    return res.status(200).json({
        success: user ? true : false,
        message: user ? 'Reset password successfully. Please login your account' : 'Failed update password',
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
    const user = await User.find().select('-password -refreshToken');
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
    const currentUser = req.user; // Giả sử thông tin người dùng đang đăng nhập nằm trong req.user
    if (currentUser.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xoá người dùng',
        });
    }

    const deletedUser = await User.findById(userId);
    if (!deletedUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    if (currentUser.role === 'admin' && deletedUser.role === 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xoá người cùng chức vụ',
        });
    }

    const user = await User.findByIdAndDelete(userId);
    return res.status(200).json({
        success: user ? true : false,
        message: user ? `Deleted user with ${user.email} successfully` : 'Deleted user failed ',
    });
});

const updateInfoFromUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId || Object.keys(req.body).length === 0)
        throw new Error('You need to type at least one field to update ');
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    let { avatar } = req.body;
    let currentUser = await User.findById(userId);
    if (avatar) {
        if (currentUser.avatar) {
            // "https://res.cloudinary.com/mycloud/image/upload/v1234567890/myfolder/avatar.png"
            // .split('/)
            // [
            //     "https:",
            //     "",
            //     "res.cloudinary.com",
            //     "mycloud",
            //     "image",
            //     "upload",
            //     "v1234567890",
            //     "myfolder",
            //     "avatar.png"
            // ]
            // .pop() --> "avatar.png"
            // .split('.) --> ["avatar", "png"]
            // [0] --> 'avatar
            await cloudinary.uploader.destroy(currentUser.avatar.split('/').pop().split('.')[0]);
        }
        const uploadResponse = await cloudinary.uploader.upload(avatar, {
            folder: 'threadsnet',
        });
        avatar = uploadResponse.secure_url;
    } else {
        avatar = currentUser.avatar;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            ...req.body,
            avatar,
        },
        { new: true },
    ).select('-password -refreshToken');

    const userById = await User.findById(userId);

    await Post.updateMany(
        {
            'replies.userId': userId,
        },
        {
            $set: {
                'replies.$[reply].username': userById.username,
                'replies.$[reply].avatar': userById.avatar,
            },
            // reply: random words, be able to change any words into reply
        },
        {
            arrayFilters: [{ 'reply.userId': userId }],
        },
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

    if (req.body.phoneNumber && !/^(09|03|07|08|05)\d{8}$/.test(req.body.phoneNumber)) {
        return res
            .status(400)
            .json({ message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 09, 03, 07, 08 hoặc 05.' });
    }

    const currentUser = req.user;
    const updatedUser = await User.findById(userId);
    if (!updatedUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    if (updatedUser.role === currentUser.role) {
        return res.status(403).json({
            success: false,
            message: 'Không được sửa thông tin người cùng chức vụ',
        });
    }

    if (currentUser.role === 'staff' && req.body.role !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Nhân viên không được phép thay đổi vai trò của người dùng',
        });
    }

    if (currentUser.role === 'staff' && updatedUser.role === 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Nhân viên không được sửa thông tin quản lý',
        });
    }

    if (currentUser.role === 'admin' && req.body.role && !['user', 'staff'].includes(req.body.role)) {
        return res.status(403).json({
            success: false,
            message: 'Quản lý chỉ có thể thay đổi vai trò thành user hoặc staff',
        });
    }

    const user = await User.findByIdAndUpdate(userId, req.body, { new: true }).select('-password -refreshToken');
    return res.status(200).json({
        success: user ? true : false,
        updatedUser: user ? user : 'Update info user from admin failed',
    });
});

const createUserFromAdmin = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;
    let { role = 'user' } = req.body;

    const passwordUser = password || '123456';
    if (!name || !username || !email) throw new Error('Missing input create user from admin');
    const user = await User.findOne({ username });
    if (user) {
        throw new Error(`User with ${username} has already existed`);
    }

    if (req.body.phoneNumber && !/^(09|03|07|08|05)\d{8}$/.test(req.body.phoneNumber)) {
        return res
            .status(400)
            .json({ message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 09, 03, 07, 08 hoặc 05.' });
    }

    const currentUser = req.user;
    if (currentUser.role === 'staff' && role !== 'user') {
        return res.status(400).json({
            success: false,
            message: 'Nhân viên chỉ được tạo chức vụ người dùng',
        });
    }
    if (currentUser.role === 'staff') {
        role = 'user';
    }
    if (currentUser.role === 'admin' && role !== 'staff' && role !== 'user') {
        return res.status(400).json({
            success: false,
            message: 'Chức vụ phải là nhân viên hoặc người dùng',
        });
    }

    const newUser = await User.create({
        ...req.body,
        password: passwordUser,
        // role: userrole, // Gán role đã xử lý vào người dùng mới
    });

    return res.status(200).json({
        success: newUser ? true : false,
        newUser: newUser ? newUser : 'Create user account from admin failed',
    });
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { query } = req.params; // query is either username or id
    const currentUserId = req.user._id;

    const currentUser = await User.findOne({ _id: currentUserId }).select('blockedList');

    let user;
    if (mongoose.Types.ObjectId.isValid(query)) {
        user = await User.findOne({ _id: query }).select('-password -updatedAt -refreshToken -isAdmin -role');
    } else {
        user = await User.findOne({ username: query }).select('-password -updatedAt -refreshToken -isAdmin -role');
    }

    // const user = await User.findOne({ username: query }).select('-password -updatedAt -refreshToken -isAdmin -role');
    console.log('user: ', user);
    if (!user) throw new Error(`User ${username} not found`);

    if (currentUser?.blockedList?.includes(user._id.toString()))
        throw new Error('You cannot access this profile because the user is in your blocked list.');

    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Get user profile failed',
    });
});

const getLikedPosts = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .populate({
            path: 'liked',
            match: {
                $or: [
                    { visibility: { $ne: 'private' } }, // Bài viết không phải là private
                    { postedBy: userId }, // Hoặc bài viết là của chính người dùng
                ],
            },
            populate: {
                path: 'postedBy',
                select: '-password -role -isAdmin -refreshToken -liked',
            },
        })
        .select('-password');

    if (!user) {
        return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({
        success: user ? true : false,
        likedPosts: user.liked,
    });
});

const getSavedPosts = asyncHandler(async (req, res) => {
    const userById = req.params.userId;

    const user = await User.findById(userById)
        .populate({
            path: 'saved',
            populate: {
                path: 'postedBy',
                select: '-password -role -isAdmin -refreshToken -saved',
            },
        })
        .select('-password');

    if (!user) {
        return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({
        success: user ? true : false,
        user: user ? user : 'Get liked posts by user failed',
    });
});

const blockedUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdToken = req.user._id;

    if (userId === userIdToken) throw new Error('You cannot block yourself');

    const userToBlock = await User.findById(userId);
    const loggedInUser = await User.findById(userIdToken);
    if (!userToBlock || !loggedInUser) throw new Error('User not found');

    const userIsBlocked = loggedInUser.blockedList.includes(userId);

    if (userIsBlocked) throw new Error('This user is in your blocked list');
    const response = await User.findByIdAndUpdate(
        userIdToken,
        {
            $push: { blockedList: userId },
        },
        { new: true },
    ).populate('blockedList', '-password -refreshToken -role -isAdmin -isBlocked');
    loggedInUser.following = loggedInUser.following.filter((id) => id.toString() !== userId);
    userToBlock.followers = userToBlock.followers.filter((id) => id.toString() !== userIdToken.toString());
    await loggedInUser.save();
    await userToBlock.save();

    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Blocked user successfully' : 'Blocked user failed',
        response: response ? response : 'Blocked user failed',
    });
});

const unblockedUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdToken = req.user._id.toString();

    if (userId === userIdToken) throw new Error('You cannot unblock yourself');

    const userToBlock = await User.findById(userId);
    const loggedInUser = await User.findById(userIdToken);
    if (!userToBlock || !loggedInUser) throw new Error('User not found');

    const userIsBlocked = loggedInUser.blockedList.includes(userId);
    if (!userIsBlocked) throw new Error('This user is not in your blocked list');

    const response = await User.findByIdAndUpdate(
        userIdToken,
        {
            $pull: { blockedList: userId },
        },
        { new: true },
    ).populate('blockedList', '-password -refreshToken -role -isAdmin -isBlocked');

    loggedInUser.blockedList = loggedInUser.blockedList.filter((id) => id.toString() !== userId);
    await loggedInUser.save();

    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Unblock user successfully' : 'Unblock user failed',
        response: response ? response : 'Unblock user failed',
    });
});

const getBlockedListUsers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
        'blockedList',
        '-password -refreshToken -role -isAdmin -isBlocked -blockedList',
    );
    if (!user) throw new Error('User not found');

    const { blockedList, ...data } = user;
    console.log('user: ', user);
    // return res.status(200).json({
    //     success: user.blockedList.length > 0 ? true : false,
    //     message: user.blockedList.length > 0 ? 'Get blocked user list successfully' : 'Get blocked user list failed',
    //     blockedList: user.blockedList.length > 0 ? user.blockedList : [],
    // });
    return res.status(200).json({
        success: blockedList ? true : false,
        message: blockedList ? 'Get blocked user list successfully' : 'Get blocked user list failed',
        blockedList: blockedList ? blockedList : [],
    });
});

module.exports = {
    register,
    login,
    lockedUser,
    getDetailUser,
    refreshCreateNewAccessToken,
    changePassword,
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
    getLikedPosts,
    getSavedPosts,
    blockedUser,
    getBlockedListUsers,
    unblockedUser,
};
