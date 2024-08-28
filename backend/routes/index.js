const userRouter = require('./UserRouter');
const postRouter = require('./PostRouter');

const { notFound, errorHandler } = require('../middlewares/errorHandlerMiddleware');

const route = (app) => {
    app.use('/api/user', userRouter);
    // app.use('/api/post', postRouter);
    app.use(notFound);
    app.use(errorHandler);
};

module.exports = route;
