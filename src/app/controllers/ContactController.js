const Contact = require('../models/Contact');

class ContactController {
    // [GET] /admin/contacts (Phân trang 10 dòng/trang)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            const totalItems = await Contact.countDocuments({});
            const totalPages = Math.ceil(totalItems / limit);
            const contacts = await Contact.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

            res.render('admin/contacts', { contacts, currentPage: page, totalPages });
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // [POST] /admin/contacts/update
    async updateStatus(req, res) {
        try {
            const { id, status } = req.body;
            await Contact.findByIdAndUpdate(id, { status: parseInt(status) });
            res.redirect('/admin/contacts');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // [GET] /admin/contacts/delete/:id
    async destroy(req, res) {
        try {
            await Contact.findByIdAndDelete(req.params.id);
            res.redirect('/admin/contacts');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi xóa liên hệ');
        }
    }
}

module.exports = new ContactController();
