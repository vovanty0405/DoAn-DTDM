const Voucher = require('../models/Voucher');
const Category = require('../models/Category');

class VoucherController {
    // [GET] /admin/vouchers
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            const vouchers = await Voucher.find({})
                .populate('category_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Voucher.countDocuments({});
            const totalPages = Math.ceil(total / limit);

            const categories = await Category.find({}); // For the modal dropdown

            res.render('admin/vouchers', {
                vouchers,
                categories,
                currentPage: page,
                totalPages,
                path: '/admin/vouchers'
            });
        } catch (error) {
            console.error(error);
            res.redirect('/admin/dashboard');
        }
    }

    // [POST] /admin/vouchers/store
    async store(req, res) {
        try {
            const { title, code, discount_type, discount_value, min_order_value, max_discount_amount, category_id, start_date, expiry_date, usage_limit } = req.body;
            
            const voucher = new Voucher({
                title,
                code: code.toUpperCase(),
                discount_type,
                discount_value,
                min_order_value: min_order_value || 0,
                max_discount_amount: max_discount_amount || 0,
                category_id: category_id === 'all' ? null : category_id,
                start_date: start_date || Date.now(),
                expiry_date,
                usage_limit: usage_limit || 0
            });

            await voucher.save();
            res.redirect('/admin/vouchers');
        } catch (error) {
            console.error(error);
            res.redirect('back');
        }
    }

    // [POST] /admin/vouchers/update
    async update(req, res) {
        try {
            const { id, title, code, discount_type, discount_value, min_order_value, max_discount_amount, category_id, start_date, expiry_date, usage_limit, status } = req.body;
            
            await Voucher.findByIdAndUpdate(id, {
                title,
                code: code.toUpperCase(),
                discount_type,
                discount_value,
                min_order_value: min_order_value || 0,
                max_discount_amount: max_discount_amount || 0,
                category_id: category_id === 'all' ? null : category_id,
                start_date,
                expiry_date,
                usage_limit: usage_limit || 0,
                status: status === '1' || status === 'on' || status === true
            });

            res.redirect('/admin/vouchers');
        } catch (error) {
            console.error(error);
            res.redirect('back');
        }
    }

    // [GET] /admin/vouchers/delete/:id
    async destroy(req, res) {
        try {
            await Voucher.findByIdAndDelete(req.params.id);
            res.redirect('/admin/vouchers');
        } catch (error) {
            console.error(error);
            res.redirect('back');
        }
    }
}

module.exports = new VoucherController();
