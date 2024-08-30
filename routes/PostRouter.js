const router = require('express').Router();
const PostController = require('../controllers/PostController');
const { verifyAccessToken, checkIsStaff, checkIsAdmin } = require('../middlewares/verifyTokenMiddleware');

router.post('/createPost', verifyAccessToken, PostController.createPost);

module.exports = router;
