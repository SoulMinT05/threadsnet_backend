const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, isAdmin, role) => {
    return jwt.sign({ _id: userId, isAdmin, role }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};
const generateRefreshToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
