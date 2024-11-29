const User = require('../models/UserModel');
const Post = require('../models/PostModel');
const Comment = require('../models/CommentModel');
const Conversation = require('../models/ConversationModel');
const asyncHandler = require('express-async-handler');
// const slugify = require('slugify');

const getStatisticsByWeek = async (req, res) => {
    try {
        const now = new Date();
        const weekCount = 4; // Số tuần để bao gồm trong báo cáo
        const statisticsWeek = []; // Mảng để lưu trữ thống kê theo tuần

        // Hàm tính tỷ lệ tăng trưởng
        const calculateGrowthRate = (current, last) =>
            current + last > 0 ? ((current - last) / (current + last)) * 100 : 0;

        // Lấy tuần hiện tại (từ 4/11 đến 10/11)
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1); // Ngày đầu tuần (Thứ Hai)
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), startOfWeek.getDate() + 6); // Ngày cuối tuần (Chủ Nhật)

        for (let i = 0; i < weekCount; i++) {
            // Tính toán các mốc thời gian cho tuần hiện tại và tuần trước đó
            const currentStartOfWeek = new Date(startOfWeek);
            const currentEndOfWeek = new Date(endOfWeek);
            const previousStartOfWeek = new Date(startOfWeek);
            const previousEndOfWeek = new Date(endOfWeek);

            // Nếu là tuần đầu tiên (hiện tại), sử dụng dữ liệu của tuần này
            if (i === 0) {
                // Lấy dữ liệu cho tuần hiện tại
                // (Bỏ qua logic tính toán trong mã gốc và thêm logic lấy dữ liệu ở đây)
            } else {
                // Thay thế tuần tiếp theo bằng dữ liệu tuần trước
                currentStartOfWeek.setDate(currentStartOfWeek.getDate() - 7 * i);
                currentEndOfWeek.setDate(currentEndOfWeek.getDate() - 7 * i);
            }

            // Lấy thống kê cho tuần
            const userCountCurrent = await User.countDocuments({
                createdAt: { $gte: currentStartOfWeek, $lt: currentEndOfWeek },
            });
            const postCountCurrent = await Post.countDocuments({
                createdAt: { $gte: currentStartOfWeek, $lt: currentEndOfWeek },
            });
            const commentCountCurrent = await Comment.countDocuments({
                createdAt: { $gte: currentStartOfWeek, $lt: currentEndOfWeek },
            });
            const populateComments = await Comment.find({
                createdAt: { $gte: currentStartOfWeek, $lt: currentEndOfWeek },
            }).populate('userId');
            const conversationCountCurrent = await Conversation.countDocuments({
                createdAt: { $gte: currentStartOfWeek, $lt: currentEndOfWeek },
            });

            // Thay thế bằng dữ liệu trước đó cho các tuần sau
            statisticsWeek.push({
                week: `${currentStartOfWeek.toLocaleDateString('vi-VN')} - ${currentEndOfWeek.toLocaleDateString(
                    'vi-VN',
                )}`,
                users: {
                    title: 'Người dùng',
                    count: userCountCurrent,
                    growthRate: calculateGrowthRate(userCountCurrent, 0), // Sử dụng 0 cho tuần trước nếu không có dữ liệu
                },
                posts: {
                    title: 'Bài viết',
                    count: postCountCurrent,
                    growthRate: calculateGrowthRate(postCountCurrent, 0),
                },
                comments: {
                    title: 'Bình luận',
                    count: commentCountCurrent,
                    growthRate: calculateGrowthRate(commentCountCurrent, 0),
                    populateComments,
                },
                conversations: {
                    title: 'Tin nhắn',
                    count: conversationCountCurrent,
                    growthRate: calculateGrowthRate(conversationCountCurrent, 0),
                },
            });
        }

        return res.status(200).json({
            success: true,
            statisticsWeek,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message + ' Lỗi' });
    }
};

const getStatisticsByMonth = async (req, res) => {
    try {
        const now = new Date();
        const monthCount = 12; // Number of months to include in the report
        const statisticsMonth = []; // Array to store statisticsMonth for each month

        // Function to calculate growth rate
        const calculateGrowthRate = (current, last) =>
            current + last > 0 ? ((current - last) / (current + last)) * 100 : 0;

        // Loop through each month and retrieve statisticsMonth
        for (let i = 0; i < monthCount; i++) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const previousStartOfMonth = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
            const previousEndOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);

            // Get counts for the current and previous month
            const userCountCurrent = await User.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } });
            const userCountLast = await User.countDocuments({
                createdAt: { $gte: previousStartOfMonth, $lt: previousEndOfMonth },
            });

            const postCountCurrent = await Post.countDocuments({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            });
            const postCountLast = await Post.countDocuments({
                createdAt: { $gte: previousStartOfMonth, $lt: previousEndOfMonth },
            });

            const commentCountCurrent = await Comment.countDocuments({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            });
            const commentCountLast = await Comment.countDocuments({
                createdAt: { $gte: previousStartOfMonth, $lt: previousEndOfMonth },
            });
            const populateComments = await Comment.find({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            }).populate('userId');

            const conversationCountCurrent = await Conversation.countDocuments({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            });
            const conversationCountLast = await Conversation.countDocuments({
                createdAt: { $gte: previousStartOfMonth, $lt: previousEndOfMonth },
            });

            // Store statisticsMonth with growth rates
            statisticsMonth.push({
                month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }), // e.g., "October 2024"
                users: {
                    title: 'Người dùng',
                    count: userCountCurrent,
                    growthRate: calculateGrowthRate(userCountCurrent, userCountLast),
                },
                posts: {
                    title: 'Bài viết',
                    count: postCountCurrent,
                    growthRate: calculateGrowthRate(postCountCurrent, postCountLast),
                },
                comments: {
                    title: 'Bình luận',
                    count: commentCountCurrent,
                    growthRate: calculateGrowthRate(commentCountCurrent, commentCountLast),
                    populateComments,
                },
                conversations: {
                    title: 'Tin nhắn',
                    count: conversationCountCurrent,
                    growthRate: calculateGrowthRate(conversationCountCurrent, conversationCountLast),
                },
            });
        }

        return res.status(200).json({
            success: true,
            statisticsMonth,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message + ' Lỗi' });
    }
};

const getStatisticsByYear = async (req, res) => {
    try {
        const now = new Date();
        const startOfCurrentYear = new Date(now.getFullYear(), 0, 1); // Bắt đầu năm hiện tại
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1); // Bắt đầu năm trước
        const endOfLastYear = new Date(now.getFullYear(), 0, 1); // Kết thúc năm trước

        // Tính tổng số lượng từng thực thể trong năm hiện tại và năm trước
        const userCountCurrent = await User.countDocuments({ createdAt: { $gte: startOfCurrentYear } });
        const userCountLast = await User.countDocuments({ createdAt: { $gte: startOfLastYear, $lt: endOfLastYear } });
        const postCountCurrent = await Post.countDocuments({ createdAt: { $gte: startOfCurrentYear } });
        const postCountLast = await Post.countDocuments({
            createdAt: { $gte: startOfLastYear, $lt: endOfLastYear },
        });
        const populatePosts = await Post.find({ createdAt: { $gte: startOfCurrentYear } }).populate('postedBy'); // Thay đổi đây tùy thuộc vào mối quan hệ của bạn
        const commentCountCurrent = await Comment.countDocuments({ createdAt: { $gte: startOfCurrentYear } });
        const commentCountLast = await Comment.countDocuments({
            createdAt: { $gte: startOfLastYear, $lt: endOfLastYear },
        });
        const populateComments = await Comment.find({ createdAt: { $gte: startOfCurrentYear } }).populate('userId'); // Thay đổi đây tùy thuộc vào mối quan hệ của bạn
        // .populate('MaSach.product'); // Nếu Bài viết cũng cần được populate

        const conversationCountCurrent = await Conversation.countDocuments({ createdAt: { $gte: startOfCurrentYear } });
        const conversationCountLast = await Conversation.countDocuments({
            createdAt: { $gte: startOfLastYear, $lt: endOfLastYear },
        });

        const calculateGrowthRate = (current, last) =>
            current + last > 0 ? ((current - last) / (current + last)) * 100 : 0;

        return res.status(200).json({
            success: true,
            users: {
                title: 'Người dùng',
                count: userCountCurrent,
                growthRate: calculateGrowthRate(userCountCurrent, userCountLast),
            },
            posts: {
                title: 'Bài viết',
                count: postCountCurrent,
                populatePosts,
                growthRate: calculateGrowthRate(postCountCurrent, postCountLast),
            },
            comments: {
                title: 'Bình luận',
                count: commentCountCurrent,
                populateComments,
                growthRate: calculateGrowthRate(commentCountCurrent, commentCountLast),
            },
            conversations: {
                title: 'Tin nhắn',
                count: conversationCountCurrent,
                growthRate: calculateGrowthRate(conversationCountCurrent, conversationCountLast),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message + 'Lỗi' });
    }
};

module.exports = {
    getStatisticsByWeek,
    getStatisticsByMonth,
    getStatisticsByYear,
};
