const router = require('express').Router();
const FriendController = require('../controllers/FriendController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/addFriend/:userId', verifyAccessToken, FriendController.addFriendRequest);
router.post('/acceptFriend/:requestId', verifyAccessToken, FriendController.acceptFriendRequest);
router.post('/rejectFriend/:requestId', verifyAccessToken, FriendController.rejectFriendRequest);

router.delete('/unfriend/:friendId', verifyAccessToken, FriendController.unfriend);

router.get('/getFriendsByUser/:userId', verifyAccessToken, FriendController.getFriendsByUser);

module.exports = router;
