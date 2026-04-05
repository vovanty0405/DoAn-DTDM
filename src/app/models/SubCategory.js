const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubCategory = new Schema({
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true }, // Tham chiếu đến Category
    name: { type: String, required: true },
    image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', SubCategory);