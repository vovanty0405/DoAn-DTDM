const Customer = require('../models/Customer');

class CustomerController {
    // 1. [GET] /admin/customers (Hiển thị danh sách + Phân trang)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            const totalItems = await Customer.countDocuments({});
            const totalPages = Math.ceil(totalItems / limit);
            const customers = await Customer.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

            res.render('admin/customers', { customers, currentPage: page, totalPages });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // 2. [POST] /admin/customers/store (Thêm mới)
    async store(req, res) {
        try {
            const newCustomer = new Customer(req.body);
            await newCustomer.save();
            res.redirect('/admin/customers');
        } catch (error) {
            res.status(500).send('Lỗi khi thêm khách hàng');
        }
    }

    // 3. [POST] /admin/customers/update (Cập nhật)
    async update(req, res) {
        try {
            await Customer.findByIdAndUpdate(req.body.id, req.body);
            res.redirect('/admin/customers');
        } catch (error) {
            res.status(500).send('Lỗi khi cập nhật khách hàng');
        }
    }

    // 4. [GET] /admin/customers/delete/:id (Xóa)
    async destroy(req, res) {
        try {
            await Customer.findByIdAndDelete(req.params.id);
            res.redirect('/admin/customers');
        } catch (error) {
            res.status(500).send('Lỗi khi xóa khách hàng');
        }
    }
}
module.exports = new CustomerController();