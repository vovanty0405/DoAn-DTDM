const express = require('express');
const router = express.Router();
const apiController = require('../app/controllers/ApiController');

// Tạo đường dẫn /products/load-more
router.get('/products/load-more', apiController.loadMoreProducts);
router.get('/cart/add', apiController.addToCart); // Phải có dòng này
router.get('/search/suggest', apiController.suggestSearch); // Tìm kiếm thời gian thực
router.get('/search/suggested-products', apiController.suggestedProducts); // Sản phẩm gợi ý

// Auth Check APIs
router.get('/auth/check', apiController.checkAuthExists);

// Notification APIs
router.get('/notifications/count', apiController.notificationCount);
router.get('/notifications', apiController.notificationList);
router.post('/notifications/mark-read', apiController.markNotificationsRead);
router.post('/notifications/mark-read/:id', apiController.markSingleNotificationRead);
router.delete('/notifications/:id', apiController.deleteNotification);

// Stock Subscription
router.post('/stock-subscribe', apiController.stockSubscribe);

// Voucher
router.post('/voucher/validate', apiController.validateVoucher);
router.post('/voucher/save', apiController.saveVoucher);
router.get('/voucher/my-vouchers', apiController.getMyVouchers);
router.get('/vouchers/public', apiController.getAllPublicVouchers);

module.exports = router;