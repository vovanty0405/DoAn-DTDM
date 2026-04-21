const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category'); // Phải gọi thêm Category model để lấy danh sách thẻ <select>
const fs = require('fs');
const xlsx = require('xlsx');

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

    // 5. [GET] /admin/sub_categories/export
    async exportExcel(req, res) {
        try {
            const sub_categories = await SubCategory.find({}).populate('category_id').lean();
            const data = sub_categories.map((sc, index) => ({
                STT: index + 1,
                Name: sc.name,
                Category: sc.category_id ? sc.category_id.name : '',
                Status: sc.status === 1 ? 'Hiển thị' : 'Ẩn'
            }));

            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "SubCategories");

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', 'attachment; filename="sub_categories.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi xuất file Excel');
        }
    }

    // 6. [POST] /admin/sub_categories/import
    async importExcel(req, res) {
        try {
            if (!req.file) {
                return res.status(400).send('<script>alert("Vui lòng chọn file Excel"); window.location.href="/admin/sub_categories";</script>');
            }

            const workbook = xlsx.read(req.file.path, { type: 'file' });
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            let successCount = 0;
            let skipCount = 0;

            for (const item of data) {
                if (!item.Name) continue;
                
                const existing = await SubCategory.findOne({ name: item.Name });
                if (existing) {
                    skipCount++;
                    continue;
                }
                
                const newSubCategory = new SubCategory({
                    name: item.Name,
                    status: item.Status === 'Ẩn' ? 0 : 1,
                });
                
                await newSubCategory.save();
                successCount++;
            }

            fs.unlinkSync(req.file.path);

            res.send(`<script>alert("Nhập file thành công! Thêm mới: ${successCount}, Bỏ qua trùng lặp: ${skipCount}"); window.location.href="/admin/sub_categories";</script>`);
        } catch (error) {
            console.log(error);
            res.status(500).send('<script>alert("Lỗi nhập file Excel"); window.location.href="/admin/sub_categories";</script>');
        }
    }
}
module.exports = new SubCategoryController();