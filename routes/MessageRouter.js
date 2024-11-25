const router = require('express').Router();
const MessageController = require('../controllers/MessageController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.get('/conversations', verifyAccessToken, MessageController.getConversations);
router.get('/:otherUserId', verifyAccessToken, MessageController.getMessages);
router.post('/', verifyAccessToken, MessageController.sendMessage);

module.exports = router;
