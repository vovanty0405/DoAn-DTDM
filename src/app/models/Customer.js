const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Customer = new Schema({
    full_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    address: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Customer', Customer);