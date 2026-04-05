const express = require('express');
const router = express.Router();
const apiController = require('../app/controllers/ApiController');

// Tạo đường dẫn /products/load-more
router.get('/products/load-more', apiController.loadMoreProducts);
router.get('/cart/add', apiController.addToCart); // Phải có dòng này

module.exports = router;