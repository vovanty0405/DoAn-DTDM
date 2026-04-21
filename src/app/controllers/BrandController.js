const Brand = require('../models/Brand');
const fs = require('fs');
const xlsx = require('xlsx');

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

    // 5. [GET] /admin/brands/export
    async exportExcel(req, res) {
        try {
            const brands = await Brand.find({}).lean();
            const data = brands.map((b, index) => ({
                STT: index + 1,
                Name: b.name,
                Description: b.description || '',
                Status: b.status === 1 ? 'Hiển thị' : 'Ẩn'
            }));

            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Brands");

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', 'attachment; filename="brands.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi xuất file Excel');
        }
    }

    // 6. [POST] /admin/brands/import
    async importExcel(req, res) {
        try {
            if (!req.file) {
                return res.status(400).send('<script>alert("Vui lòng chọn file Excel"); window.location.href="/admin/brands";</script>');
            }

            const workbook = xlsx.read(req.file.path, { type: 'file' });
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            let successCount = 0;
            let skipCount = 0;

            for (const item of data) {
                if (!item.Name) continue;
                
                const existing = await Brand.findOne({ name: item.Name });
                if (existing) {
                    skipCount++;
                    continue;
                }
                
                const newBrand = new Brand({
                    name: item.Name,
                    description: item.Description || '',
                    status: item.Status === 'Ẩn' ? 0 : 1,
                });
                
                await newBrand.save();
                successCount++;
            }

            fs.unlinkSync(req.file.path);

            res.send(`<script>alert("Nhập file thành công! Thêm mới: ${successCount}, Bỏ qua trùng lặp: ${skipCount}"); window.location.href="/admin/brands";</script>`);
        } catch (error) {
            console.log(error);
            res.status(500).send('<script>alert("Lỗi nhập file Excel"); window.location.href="/admin/brands";</script>');
        }
    }
}
module.exports = new BrandController(); 