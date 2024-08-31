const router = require('express').Router();
const PostController = require('../controllers/PostController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/createPost', verifyAccessToken, PostController.createPost);
router.get('/getAllPosts', [verifyAccessToken, checkIsAdmin], PostController.getAllPosts);

router.get('/:postId', PostController.getDetailPost);
router.put('/:postId', verifyAccessToken, PostController.updatePost);
router.delete('/:postId', verifyAccessToken, PostController.deletePost);

module.exports = router;
