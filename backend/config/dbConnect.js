const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        const connect = mongoose.connect(process.env.MONGODB_URI);
        console.log('Connect to DB successfully!');
    } catch (err) {
        console.log('err: ', err);
    }
};

module.exports = dbConnect;
