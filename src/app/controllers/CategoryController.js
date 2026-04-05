const Category = require('../models/Category');

class CategoryController {
    // 1. [GET] /admin/categories (Hiển thị danh sách)
    async index(req, res) {
        try {
            // Lấy tất cả danh mục, sắp xếp mới nhất (giống ORDER BY id DESC)
            // .lean() giúp chuyển data Mongoose thành object Javascript thường để EJS dễ đọc
            const categories = await Category.find({}).sort({ createdAt: -1 }).lean(); 
            
            // Trả về file categorys.ejs và truyền biến categories ra giao diện
            res.render('admin/categorys', { categories }); 
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // 2. [POST] /admin/categories/store (Xử lý thêm mới)
    async store(req, res) {
        try {
            const newCategory = new Category(req.body); // req.body chứa name, slug, description, status từ form
            await newCategory.save();
            res.redirect('/admin/categories'); // Giống header("Location: ...") trong PHP
        } catch (error) {
            res.status(500).send('Lỗi khi thêm danh mục');
        }
    }

    // 3. [POST] /admin/categories/update (Xử lý cập nhật)
    async update(req, res) {
        try {
            // req.body.id được gửi từ input type="hidden" trong modal Sửa
            await Category.findByIdAndUpdate(req.body.id, req.body);
            res.redirect('/admin/categories');
        } catch (error) {
            res.status(500).send('Lỗi khi cập nhật');
        }
    }

    // 4. [GET] /admin/categories/delete/:id (Xử lý xóa)
    async destroy(req, res) {
        try {
            // Lấy id từ URL (req.params.id)
            await Category.findByIdAndDelete(req.params.id);
            res.redirect('/admin/categories');
        } catch (error) {
            res.status(500).send('Lỗi khi xóa');
        }
    }
}

module.exports = new CategoryController();