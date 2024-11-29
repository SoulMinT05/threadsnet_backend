const userRouter = require('./UserRouter');
const postRouter = require('./PostRouter');
const commentRouter = require('./CommentRouter');
const friendRouter = require('./FriendRouter');
const messageRouter = require('./MessageRouter');
const conversationRouter = require('./ConversationRouter');
const sensitiveWordRouter = require('./SensitiveWordRouter');
const statisticRouter = require('./StatisticRouter');

const { notFound, errorHandler } = require('../middlewares/errorHandlerMiddleware');

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/post', postRouter);
    app.use('/api/message', messageRouter);
    // app.use('/api/conversation', conversationRouter);
    app.use('/api/comment', commentRouter);
    app.use('/api/friend', friendRouter);
    app.use('/api/sensitiveWord', sensitiveWordRouter);
    app.use('/api/statistic', statisticRouter);
    app.use(notFound);
    app.use(errorHandler);
};

module.exports = route;
