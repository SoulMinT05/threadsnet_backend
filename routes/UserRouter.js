const router = require('express').Router();
const UserController = require('../controllers/UserController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/getDetailUser', verifyAccessToken, UserController.getDetailUser);
router.post('/refreshCreateNewAccessToken', UserController.refreshCreateNewAccessToken);
router.post('/logout', UserController.logout);
router.get('/forgotPassword', UserController.forgotPassword);
router.put('/resetPassword', UserController.resetPassword);
router.put('/updateInfoFromUser', [verifyAccessToken], UserController.updateInfoFromUser);
router.get('/getAllUsers', [verifyAccessToken, checkIsAdmin], UserController.getAllUsers);
router.post('/createUserFromAdmin', [verifyAccessToken, checkIsAdmin], UserController.createUserFromAdmin);

router.delete('/:userId', [verifyAccessToken, checkIsAdmin], UserController.deleteUser);

router.put('/block/:userId', [verifyAccessToken, checkIsAdmin], UserController.blockUser);
router.get('/profile/:query', UserController.getUserProfile);
router.put('/follow/:userId', verifyAccessToken, UserController.followUser);
router.put('/updateInfoFromAdmin/:userId', [verifyAccessToken, checkIsAdmin], UserController.updateInfoFromAdmin);

module.exports = router;
