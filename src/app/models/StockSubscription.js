const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StockSubscription = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true }
}, { timestamps: true });

// Đảm bảo mỗi user chỉ đăng ký 1 lần cho mỗi sản phẩm
StockSubscription.index({ user_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('StockSubscription', StockSubscription);
