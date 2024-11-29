const express = require('express');
const SensitiveWordController = require('../controllers/SensitiveWordController');
const router = express.Router();
const {
    verifyAccessToken,
    checkIsStaff,
    checkIsAdmin,
    checkBlockedUser,
    checkAdminOrStaff,
} = require('../middlewares/verifyTokenMiddleware');

// Routes
router.get('/getSensitiveWords', SensitiveWordController.getSensitiveWords); // Lấy danh sách từ nhạy cảm
router.post('/addSensitiveWords', [verifyAccessToken, checkAdminOrStaff], SensitiveWordController.addSensitiveWords); // Thêm từ nhạy cảm
router.delete(
    '/deleteSensitiveWord',
    [verifyAccessToken, checkAdminOrStaff],
    SensitiveWordController.deleteSensitiveWord,
); // Xóa từ nhạy cảm

module.exports = router;
