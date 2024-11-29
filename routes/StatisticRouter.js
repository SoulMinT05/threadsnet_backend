const router = require('express').Router();
const StatisticController = require('../controllers/StatisticController');
const {
    verifyAccessToken,
    checkIsStaff,
    checkIsAdmin,
    checkAdminOrStaff,
} = require('../middlewares/verifyTokenMiddleware');

router.get('/week', [verifyAccessToken, checkAdminOrStaff], StatisticController.getStatisticsByWeek);
router.get('/month', [verifyAccessToken, checkAdminOrStaff], StatisticController.getStatisticsByMonth);
router.get('/year', [verifyAccessToken, checkAdminOrStaff], StatisticController.getStatisticsByYear);

module.exports = router;
