const router = require('express').Router();
const PostController = require('../controllers/PostController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/createPost', verifyAccessToken, PostController.createPost);
router.get('/getAllPosts', PostController.getAllPosts);
router.get('/following', verifyAccessToken, PostController.getFollowingPosts);

router.put('/:postId/reply/:replyId', verifyAccessToken, PostController.updateReplyPost);
router.delete('/:postId/reply/:replyId', verifyAccessToken, PostController.deleteReplyPost);
router.put('/liked/:postId', verifyAccessToken, PostController.likePost);
router.post('/reply/:postId', verifyAccessToken, PostController.replyPost);
router.put('/saved/:postId', verifyAccessToken, PostController.savePost);
router.put('/reposted/:postId', verifyAccessToken, PostController.repostPost);
router.get('/user/:username', PostController.getUserPosts);
router.get('/:postId', PostController.getDetailPost);
router.put('/:postId', verifyAccessToken, PostController.updatePost);
router.delete('/:postId', verifyAccessToken, PostController.deletePost);

module.exports = router;
