const router = require('express').Router();
const PostController = require('../controllers/PostController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/createPost', verifyAccessToken, PostController.createPost);
router.get('/getAllPosts', PostController.getAllPosts);

router.get('/:postId', PostController.getDetailPost);

module.exports = router;
