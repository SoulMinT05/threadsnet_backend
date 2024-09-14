const router = require('express').Router();
const CommentController = require('../controllers/CommentController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

// Reply
router.put('/update/:commentId/reply/:replyId', verifyAccessToken, CommentController.updateReply);
router.delete('/delete/:commentId/reply/:replyId', verifyAccessToken, CommentController.deleteReply);
router.post('/create/reply/:commentId', verifyAccessToken, CommentController.createReply);

// Get all post comments
router.get('/post/:postId', verifyAccessToken, CommentController.getAllCommentsInPost);

// Comment
router.post('/like/:commentId', verifyAccessToken, CommentController.likeComment);
router.post('/:postId', verifyAccessToken, CommentController.createComment);
router.put('/:commentId', verifyAccessToken, CommentController.updateComment);
router.delete('/:commentId', verifyAccessToken, CommentController.deleteComment);

module.exports = router;
