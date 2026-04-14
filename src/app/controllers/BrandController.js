const Brand = require('../models/Brand');

class BrandController {
    // 1. [GET] /admin/brands (Hiển thị danh sách + Phân trang)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            const totalItems = await Brand.countDocuments({});
            const totalPages = Math.ceil(totalItems / limit);
            const brands = await Brand.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

            res.render('admin/brand', { brands, currentPage: page, totalPages });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }
    // 2. [POST] /admin/brands/store (Xử lý thêm mới)
    async store(req, res) {
        try {            
            const newBrand = new Brand(req.body);
            await newBrand.save();
            res.redirect('/admin/brands');
        } catch (error) {
            res.status(500).send('Lỗi khi thêm thương hiệu');
        }
    }
    // 3. [POST] /admin/brands/update (Xử lý cập nhật)
    async update(req, res) {
        try {
            const frmData = req.body;
            await Brand.findByIdAndUpdate(req.body.id, frmData);
            res.redirect('/admin/brands');
        } catch (error) {
            res.status(500).send('Lỗi khi cập nhật thương hiệu');
        }
    }
    // 4. [POST] /admin/brands/delete (Xử lý xóa)
    async delete(req, res) {
        try {
            const id = req.params.id;
            await Brand.findByIdAndDelete(id);
            res.redirect('/admin/brands');
        } catch (error) {
            res.status(500).send('Lỗi khi xóa thương hiệu');
        }
    }
}
module.exports = new BrandController(); 