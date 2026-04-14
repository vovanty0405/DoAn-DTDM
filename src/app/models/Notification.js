const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Notification = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'order' }, // 'order', 'stock', 'system'
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    is_read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', Notification);
