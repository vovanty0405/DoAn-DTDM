const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Voucher = new Schema({
    title: { type: String, required: true }, // VD: Giảm 10%, Giảm 50K
    code: { type: String, required: true, unique: true, uppercase: true }, // VD: PEW50K
    discount_type: { type: String, enum: ['percent', 'fixed'], required: true },
    discount_value: { type: Number, required: true },
    min_order_value: { type: Number, default: 0 },
    max_discount_amount: { type: Number, default: 0 },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // Null = Toàn sàn
    start_date: { type: Date, required: true, default: Date.now },
    expiry_date: { type: Date, required: true },
    usage_limit: { type: Number, default: 0 }, // 0 = Không giới hạn
    used_count: { type: Number, default: 0 },
    status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', Voucher);
