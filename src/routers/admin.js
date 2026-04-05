var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');


// 1. Cấu hình Multer để lưu ảnh vào thư mục public/uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/public/uploads/') // Thư mục lưu file
    },
    filename: function (req, file, cb) {
        // Đổi tên file để không bị trùng (thêm timestamp vào trước tên gốc)
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

const categoryController = require('../app/controllers/CategoryController');
const productController = require('../app/controllers/ProductController');
const subCategoryController = require('../app/controllers/SubCategoryController');

// Category routes
router.get('/categories', categoryController.index);               // Trang danh sách
router.post('/categories/store', categoryController.store);        // Submit form thêm
router.post('/categories/update', categoryController.update);      // Submit form sửa
router.get('/categories/delete/:id', categoryController.destroy);  // Bấm nút xóa

// Product routes
router.get('/products', productController.index);
// Dùng upload.single('cover_image') để hứng file từ input có name="cover_image"
router.post('/products/store', upload.single('cover_image'), productController.store);
router.post('/products/update', upload.single('cover_image'), productController.update);
router.get('/products/delete/:id', productController.destroy);

// sub_categories
router.get('/sub_categories', subCategoryController.index);
// Thêm upload.single('image') vào để hứng file ảnh
router.post('/sub_categories/store', upload.single('image'), subCategoryController.store);
router.post('/sub_categories/update', upload.single('image'), subCategoryController.update);
router.get('/sub_categories/delete/:id', subCategoryController.destroy);

// Brand routes
const brandController = require('../app/controllers/BrandController');
router.get('/brands', brandController.index);
router.post('/brands/store', brandController.store);
router.post('/brands/update', brandController.update);
router.get('/brands/delete/:id', brandController.delete);

// Customer và Order routes
const customerController = require('../app/controllers/CustomerController');
const orderController = require('../app/controllers/OrderController');

// Khách Hàng
router.get('/customers', customerController.index);
router.post('/customers/store', customerController.store);
router.post('/customers/update', customerController.update);
router.get('/customers/delete/:id', customerController.destroy);

// Đơn Hàng
router.get('/orders', orderController.index);
//router.post('/orders/store', orderController.store);
router.post('/orders/update', orderController.updateStatus);
router.get('/orders/delete/:id', orderController.destroy);
router.get('/orders/detail/:id', orderController.detail); // Route xem chi tiết



module.exports = router;