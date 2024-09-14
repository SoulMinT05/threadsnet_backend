const router = require('express').Router();
const CommentController = require('../controllers/CommentController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

// Reply
router.put('/update/:commentId/reply/:replyId', verifyAccessToken, CommentController.updateReply);
router.post('/create/reply/:commentId', verifyAccessToken, CommentController.createReply);

// Comment
router.post('/:postId', verifyAccessToken, CommentController.createComment);
router.put('/:commentId', verifyAccessToken, CommentController.updateComment);

module.exports = router;
