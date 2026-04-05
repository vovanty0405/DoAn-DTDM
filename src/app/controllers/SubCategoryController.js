const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category'); // Phải gọi thêm Category model để lấy danh sách thẻ <select>

class SubCategoryController {
    // 1. [GET] /admin/sub_categories (Hiển thị danh sách)
    async index(req, res) {
        try {
            const sub_categories = await SubCategory.find({})
                                                    .populate('category_id') // Kéo dữ liệu từ bảng Category sang
                                                    .sort({ createdAt: -1 })
                                                    .lean();
            const categories = await Category.find({ status: 1 }).lean();
            
            res.render('admin/sub_category', { sub_categories, categories });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // 2. [POST] /admin/sub_categories/store (Xử lý thêm mới)
    async store(req, res) {
        try {
            const formData = req.body;
            
            // Xử lý lưu đường dẫn ảnh nếu người dùng có chọn file
            if (req.file) {
                formData.image = 'uploads/' + req.file.filename;
            }

            const newSubCategory = new SubCategory(formData);
            await newSubCategory.save();
            res.redirect('/admin/sub_categories');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi thêm thể loại con');
        }
    }

    // 3. [POST] /admin/sub_categories/update (Xử lý cập nhật)
    async update(req, res) {
        try {
            const formData = req.body;
            
            // Nếu có upload ảnh mới, cập nhật lại đường dẫn ảnh
            if (req.file) {
                formData.image = 'uploads/' + req.file.filename;
            }

            await SubCategory.findByIdAndUpdate(req.body.id, formData);
            res.redirect('/admin/sub_categories');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi cập nhật thể loại con');
        }
    }

    // 4. [GET] /admin/sub_categories/delete/:id (Xử lý xóa)
    async destroy(req, res) {
        try {
            await SubCategory.findByIdAndDelete(req.params.id);
            res.redirect('/admin/sub_categories');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi xóa thể loại con');
        }
    }
}
module.exports = new SubCategoryController();