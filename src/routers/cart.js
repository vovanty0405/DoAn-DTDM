const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

router.get('/', cartController.index);
router.get('/buy-now/:id', cartController.buyNow);
router.get('/remove/:id', cartController.remove);
router.post('/update', cartController.update);

module.exports = router;