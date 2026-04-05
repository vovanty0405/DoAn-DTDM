const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Brand = new Schema({
    name: { type: String, required: true, maxLength: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Brand', Brand);