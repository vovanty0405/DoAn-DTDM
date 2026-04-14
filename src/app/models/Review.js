const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Review = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, default: null }, // null cho reply (không chấm sao)
    comment: { type: String },
    status: { type: Number, default: 1 }, // 1 là đã duyệt tự động
    parent_id: { type: Schema.Types.ObjectId, ref: 'Review', default: null }, // null = đánh giá gốc, có giá trị = reply
    replies: [{
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Review', Review);