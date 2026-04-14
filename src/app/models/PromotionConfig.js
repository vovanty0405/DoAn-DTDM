const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Cấu hình Bảng Khuyến mãi để lưu trạng thái của 2 Block trang chủ
const PromotionConfig = new Schema({
    // Slot 1: Siêu Sale Cuối Tuần (Banner to)
    promo1_category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    promo1_percent: { type: Number, default: 0 },

    // Slot 2: Ưu đãi độc quyền (Box 6 món)
    promo2_category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    promo2_percent: { type: Number, default: 0 },

    // Banner Danh Mục (Dynamic Category Banner)
    banner_image: { type: String, default: null },
    banner_category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });

module.exports = mongoose.model('PromotionConfig', PromotionConfig);
