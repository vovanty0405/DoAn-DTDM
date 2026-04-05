const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const fs = require('fs');
const path = require('path');

class ProductController {
    // [GET] /admin/products
    async index(req, res) {
        try {
            // 1. TẠO BỘ LỌC TÌM KIẾM CHO ADMIN
            let filter = {};
            
            // Nếu có nhập tên sản phẩm trên thanh tìm kiếm
            if (req.query.keyword) {
                // Dùng $regex để tìm kiếm gần đúng, $options: 'i' để không phân biệt hoa/thường
                filter.name = { $regex: req.query.keyword, $options: 'i' };
            }
            
            // Nếu có chọn lọc theo danh mục
            if (req.query.category_id) {
                filter.category_id = req.query.category_id;
            }

            // 2. TÌM SẢN PHẨM THEO BỘ LỌC
            const products = await Product.find(filter)
                .populate('category_id')
                .populate('sub_category_id') // Nhớ populate để lấy tên thể loại con
                .populate('brand_id')
                .sort({ createdAt: -1 })
                .lean();

            // 3. LẤY DỮ LIỆU ĐỔ VÀO CÁC DROPDOWN
            const categories = await Category.find({ status: 1 }).lean();
            const subCategories = await SubCategory.find({}).populate('category_id').lean();
            const brands = await Brand.find({}).lean();

            // Truyền thêm biến query ra view để giữ lại từ khóa trên thanh tìm kiếm sau khi bấm Lọc
            res.render('admin/product', { products, categories, subCategories, brands, query: req.query });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // [POST] /admin/products/store
    async store(req, res) {
        try {
            const formData = req.body;
            // Nếu có upload ảnh, lưu đường dẫn ảnh vào formData
            if (req.file) {
                formData.cover_image = 'uploads/' + req.file.filename;
            }
            
            // Ép kiểu các trường rỗng về null để tránh lỗi MongoDB
            if(!formData.discount_price) formData.discount_price = null;
            if(!formData.sub_category_id) formData.sub_category_id = null;

            const newProduct = new Product(formData);
            await newProduct.save();
            res.redirect('/admin/products');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi thêm sản phẩm');
        }
    }

    // [POST] /admin/products/update
    async update(req, res) {
        try {
            const formData = req.body;
            
            // Nếu có upload ảnh mới, cập nhật đường dẫn ảnh
            if (req.file) {
                formData.cover_image = 'uploads/' + req.file.filename;
                // Tùy chọn nâng cao: Bạn có thể code thêm logic xóa file ảnh cũ trong thư mục uploads ở đây
            }

            if(!formData.discount_price) formData.discount_price = null;
            if(!formData.sub_category_id) formData.sub_category_id = null;

            await Product.findByIdAndUpdate(req.body.id, formData);
            res.redirect('/admin/products');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi cập nhật');
        }
    }

    // [GET] /admin/products/delete/:id
    async destroy(req, res) {
        try {
            await Product.findByIdAndDelete(req.params.id);
            res.redirect('/admin/products');
        } catch (error) {
            res.status(500).send('Lỗi khi xóa');
        }
    }
}

module.exports = new ProductController();