const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contact = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: Number, default: 0 } // 0: Chưa xử lý, 1: Đã xử lý
}, { timestamps: true });

module.exports = mongoose.model('Contact', Contact);
