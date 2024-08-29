const router = require('express').Router();
const UserController = require('../controllers/UserController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/getDetailUser', verifyAccessToken, UserController.getDetailUser);
router.get('/logout', UserController.logout);

module.exports = router;
