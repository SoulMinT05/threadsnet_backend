const router = require('express').Router();
const CommentController = require('../controllers/CommentController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/reply/:commentId', verifyAccessToken, CommentController.createReply);
router.post('/:postId', verifyAccessToken, CommentController.createComment);

module.exports = router;
