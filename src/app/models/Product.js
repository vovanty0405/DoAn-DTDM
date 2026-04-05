const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = new Schema({
    name: { type: String, required: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category' },
    sub_category_id: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
    brand_id: { type: Schema.Types.ObjectId, ref: 'Brand' },
    price: { type: Number, required: true },
    discount_price: { type: Number, default: null },
    stock_quantity: { type: Number, default: 0 },
    description: { type: String },
    cover_image: { type: String },
    status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Product', Product);