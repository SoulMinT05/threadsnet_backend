const mongoose = require('mongoose');

const SensitiveWordSchema = new mongoose.Schema(
    {
        words: { type: [String], default: [] },
    },
    { timestamps: true },
);

module.exports = mongoose.model('SensitiveWord', SensitiveWordSchema);
