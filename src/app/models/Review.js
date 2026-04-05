const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Review = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    status: { type: Number, default: 1 } // 1 là đã duyệt tự động
}, { timestamps: true });

module.exports = mongoose.model('Review', Review);