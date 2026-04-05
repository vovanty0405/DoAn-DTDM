const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Cart = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Cart', Cart);