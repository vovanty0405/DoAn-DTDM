// src/routers/site.js
const express = require('express');
const router = express.Router();
const siteController = require('../app/controllers/SiteController');
const checkOutController = require('../app/controllers/CheckoutController');

// Khi người dùng vào thư mục gốc '/', nó sẽ gọi hàm index của SiteController
router.get('/', siteController.index);
// Route trang chi tiết danh mục
router.get('/category/:slug', siteController.category);

// Route trang About & Contact
router.get('/about', siteController.about);
router.get('/contact', siteController.contact);
router.post('/contact/store', siteController.storeContact);

// Route trang thanh toán
router.get('/checkout', checkOutController.index);
router.post('/checkout/place-order', checkOutController.placeOrder);

// Route tìm kiếm sản phẩm
router.get('/search', siteController.search);

// Route chi tiết sản phẩm và đánh giá
router.get('/product/:id', siteController.productDetail);
router.post('/product/:id/review', siteController.submitReview);
router.post('/product/:id/review/reply', siteController.replyReview);

// Route đơn hàng của tôi
router.get('/orders', siteController.myOrders);

// Route tài khoản của tôi
router.get('/profile', siteController.profile);
router.post('/profile/update', siteController.updateProfile);

module.exports = router;