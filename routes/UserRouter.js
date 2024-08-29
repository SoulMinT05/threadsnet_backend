const router = require('express').Router();
const UserController = require('../controllers/UserController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/getDetailUser', verifyAccessToken, UserController.getDetailUser);
router.post('/refreshCreateNewAccessToken', UserController.refreshCreateNewAccessToken);
router.get('/logout', UserController.logout);
router.put('/updateInfoFromUser', [verifyAccessToken], UserController.updateInfoFromUser);

router.put('/follow/:userId', verifyAccessToken, UserController.followUser);
router.put('/updateInfoFromAdmin/:userId', [verifyAccessToken, checkIsAdmin], UserController.updateInfoFromAdmin);

module.exports = router;
