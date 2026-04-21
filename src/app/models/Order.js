const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullname: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    payment_method: { type: String, required: true },
    total_money: { type: Number, required: true },
    shipping_fee: { type: Number, default: 0 },
    status: { type: Number, default: 0 }, // 0: Mới đặt, 1: Đang xử lý, 2: Đang giao, 3: Hoàn thành
    // Lưu thẳng danh sách món hàng vào bên trong đơn hàng này (Thay thế cho bảng order_details cũ)
    items: [{
        product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
        price: Number,
        quantity: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Order', Order);