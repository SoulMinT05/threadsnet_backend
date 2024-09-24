const router = require('express').Router();
const PostController = require('../controllers/PostController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.put('/liked/:postId', verifyAccessToken, PostController.likePost);
router.put('/saved/:postId', verifyAccessToken, PostController.savePost);
router.put('/reposted/:postId', verifyAccessToken, PostController.repostPost);
router.put('/updateVisibilityPost/:postId', verifyAccessToken, PostController.updateVisibilityPost);

router.get('/user/:username', verifyAccessToken, PostController.getUserPosts);

router.post('/createPost', verifyAccessToken, PostController.createPost);
router.get('/getPostsByVisibility', verifyAccessToken, PostController.getPostsByVisibility);
router.get('/getAllPosts', verifyAccessToken, PostController.getAllPosts);
router.get('/public', PostController.getPublicPosts);
router.get('/following', verifyAccessToken, PostController.getFollowingPosts);
router.get('/friends', verifyAccessToken, PostController.getFriendPosts);

router.get('/:postId', PostController.getDetailPost);
router.put('/:postId', verifyAccessToken, PostController.updatePost);
router.delete('/:postId', verifyAccessToken, PostController.deletePost);

module.exports = router;
