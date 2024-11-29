const SensitiveWord = require('../models/SensitiveWordModel');
const asyncHandler = require('express-async-handler');

// Lấy danh sách từ nhạy cảm
const getSensitiveWords = asyncHandler(async (req, res) => {
    // const words = await SensitiveWord.find().select('words');
    // return res.status(200).json({
    //     success: words ? true : false,
    //     words,
    // });
    const sensitiveWord = await SensitiveWord.findOne();

    if (!sensitiveWord) {
        return res.status(404).json({
            success: false,
            message: 'No sensitive words found',
        });
    }

    return res.status(200).json({
        success: true,
        words: sensitiveWord.words, // Trả về mảng words trực tiếp
    });
});

// Thêm từ nhạy cảm

const addSensitiveWords = asyncHandler(async (req, res) => {
    let { words } = req.body;

    // Kiểm tra nếu words là chuỗi JSON, cần parse nó thành mảng
    if (typeof words === 'string') {
        words = JSON.parse(words);
    }

    console.log('Received words:', words); // Kiểm tra lại mảng words

    if (!Array.isArray(words)) {
        throw new Error('Words must be a non-empty array');
    }

    const uniqueWords = [...new Set(words.map((word) => word.trim().toLowerCase()))];

    let sensitiveWords = await SensitiveWord.findOne();

    if (!sensitiveWords) {
        sensitiveWords = await SensitiveWord.create({ words: uniqueWords });
    } else {
        const existingWordsSet = new Set(sensitiveWords.words);
        const newWords = uniqueWords.filter((word) => !existingWordsSet.has(word));

        if (newWords.length > 0) {
            sensitiveWords.words.push(...newWords);
            await sensitiveWords.save();
        }
    }

    res.status(201).json({
        success: true,
        message: 'Sensitive words updated successfully',
        words: sensitiveWords.words,
    });
});

// Xóa từ nhạy cảm
const deleteSensitiveWord = asyncHandler(async (req, res) => {
    const { word } = req.body; // Nhận từ cần xóa từ body

    if (!word) {
        throw new Error('Word is required'); // Kiểm tra xem từ có được truyền không
    }

    // Tìm bản ghi SensitiveWord trong cơ sở dữ liệu
    let sensitiveWords = await SensitiveWord.findOne();

    if (!sensitiveWords) {
        throw new Error('No sensitive words found');
    }

    // Kiểm tra xem từ có trong danh sách không
    const wordIndex = sensitiveWords.words.indexOf(word);

    if (wordIndex === -1) {
        throw new Error('Word not found');
    }

    // Xóa từ khỏi mảng
    sensitiveWords.words.splice(wordIndex, 1);

    // Lưu lại thay đổi vào cơ sở dữ liệu
    await sensitiveWords.save();

    res.status(200).json({
        success: true,
        message: `Word '${word}' has been removed successfully`,
        words: sensitiveWords.words, // Trả lại danh sách các từ còn lại
    });
});

module.exports = { getSensitiveWords, addSensitiveWords, deleteSensitiveWord };
