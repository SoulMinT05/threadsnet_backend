const router = require('express').Router();
const UserController = require('../controllers/UserController');
const {
    verifyAccessToken,
    checkIsStaff,
    checkIsAdmin,
    checkBlockedUser,
} = require('../middlewares/verifyTokenMiddleware');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/getDetailUser', [verifyAccessToken], UserController.getDetailUser);
router.post('/refreshCreateNewAccessToken', UserController.refreshCreateNewAccessToken);
router.post('/logout', UserController.logout);
router.get('/forgotPassword', UserController.forgotPassword);
router.put('/resetPassword', UserController.resetPassword);
router.put('/updateInfoFromUser', [verifyAccessToken], UserController.updateInfoFromUser);
router.get('/getAllUsers', [verifyAccessToken, checkIsAdmin], UserController.getAllUsers);
router.post('/createUserFromAdmin', [verifyAccessToken, checkIsAdmin], UserController.createUserFromAdmin);
router.get('/liked/:userId', [verifyAccessToken], UserController.getLikedPosts);
router.get('/saved/:userId', [verifyAccessToken], UserController.getSavedPosts);

// User blocked any users
router.put('/blocked/:userId', [verifyAccessToken], UserController.blockedUser);
router.put('/unblocked/:userId', [verifyAccessToken], UserController.unblockedUser);
router.get('/getBlockedListUsers/:userId', [verifyAccessToken], UserController.getBlockedListUsers);
// Admin locked account
router.put('/locked/:userId', [verifyAccessToken, checkIsAdmin], UserController.lockedUser);
router.get('/profile/:query', UserController.getUserProfile);
router.put('/follow/:userId', verifyAccessToken, UserController.followUser);

router.put('/updateInfoFromAdmin/:userId', [verifyAccessToken, checkIsAdmin], UserController.updateInfoFromAdmin);
router.post('/changePassword', [verifyAccessToken], UserController.changePassword);
router.delete('/:userId', [verifyAccessToken, checkIsAdmin], UserController.deleteUser);

module.exports = router;
