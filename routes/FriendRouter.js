const router = require('express').Router();
const FriendController = require('../controllers/FriendController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/addFriend/:userId', verifyAccessToken, FriendController.addFriendRequest);
router.post('/acceptFriend/:requestId', verifyAccessToken, FriendController.acceptFriendRequest);
router.post('/rejectFriend/:requestId', verifyAccessToken, FriendController.rejectFriendRequest);

// router.get('/:userId/friends', FriendController.getFriends);

module.exports = router;
