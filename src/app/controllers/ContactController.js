const Contact = require('../models/Contact');

class ContactController {
    // [GET] /admin/contacts
    async index(req, res) {
        try {
            const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
            res.render('admin/contacts', { contacts });
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
            res.redirect('back');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // [GET] /admin/contacts/delete/:id
    async destroy(req, res) {
        try {
            await Contact.findByIdAndDelete(req.params.id);
            res.redirect('back');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi xóa liên hệ');
        }
    }
}

module.exports = new ContactController();
