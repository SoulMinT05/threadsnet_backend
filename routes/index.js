const userRouter = require('./UserRouter');
const postRouter = require('./PostRouter');
const commentRouter = require('./CommentRouter');

const { notFound, errorHandler } = require('../middlewares/errorHandlerMiddleware');

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/post', postRouter);
    app.use('/api/comment', commentRouter);
    app.use(notFound);
    app.use(errorHandler);
};

module.exports = route;
