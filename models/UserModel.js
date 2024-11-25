const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            default: 'user',
        },
        password: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
            default: '',
        },
        posts: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Post',
            },
        ],
        followers: {
            type: [String],
            default: [],
        },
        following: {
            type: [String],
            default: [],
        },
        bio: {
            type: String,
            default: '',
        },
        saved: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Post',
            },
        ],
        liked: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Post',
            },
        ],
        isLocked: {
            type: Boolean,
            default: false,
        },
        blockedList: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
            },
        ],
        friends: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Friend',
            },
        ],
        refreshToken: {
            type: String,
        },
        passwordChangedAt: {
            type: Date,
        },
        passwordResetToken: {
            type: String,
        },
        passwordResetExpires: {
            type: String,
        },
        registerToken: {
            type: String,
        },
    },
    {
        // _id: false,
        timestamps: true,
    },
);

// Hash password to DB
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = bcrypt.genSaltSync(10);
    this.password = await bcrypt.hashSync(this.password, salt);
});

// Check req.body.password is same password in DB
// password: req.body.password
UserSchema.methods = {
    isCorrectPassword: async function (password) {
        return await bcrypt.compare(password, this.password);
    },
    createPasswordChangeToken: function () {
        // Create data random
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Create hash and update data by hex
        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.passwordResetExpires = Date.now() + 5 * 60 * 1000;
        return resetToken;
    },
};

//Export the model
module.exports = mongoose.model('User', UserSchema);
