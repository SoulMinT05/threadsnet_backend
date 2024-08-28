const router = require('express').Router();
const UserController = require('../controllers/UserController');
// const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/register', UserController.register);

module.exports = router;
