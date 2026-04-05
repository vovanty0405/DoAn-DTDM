const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Category = new Schema({
    name: { type: String, required: true, maxLength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Category', Category);