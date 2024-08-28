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
            default:
                'https://instagram.fsgn5-12.fna.fbcdn.net/v/t51.29350-15/456466913_1036520488101447_906285575479780781_n.jpg?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDIwMjUuc2RyLmYyOTM1MC5kZWZhdWx0X2ltYWdlIn0&_nc_ht=instagram.fsgn5-12.fna.fbcdn.net&_nc_cat=103&_nc_ohc=ZuR1K6a5yMMQ7kNvgFghuls&edm=APs17CUBAAAA&ccb=7-5&ig_cache_key=MzQ0MDQ2MzY3OTk4NDgwNTEyMQ%3D%3D.2-ccb7-5&oh=00_AYAiV0euhxVoz-_8YQZ9t9vVVpTAUHBKNaXPclIf2dqesQ&oe=66D507BB&_nc_sid=10d13b',
        },
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
        favorite: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'Post',
            },
        ],
        isBlocked: {
            type: Boolean,
            default: false,
        },
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
        this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        return resetToken;
    },
};

//Export the model
module.exports = mongoose.model('User', UserSchema);
