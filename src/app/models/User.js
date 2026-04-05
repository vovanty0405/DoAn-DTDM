const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: Number, default: 0 }, // 0: Khách, 1: Admin
    status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', User);