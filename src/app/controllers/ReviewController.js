const Review = require('../models/Review');

class ReviewController {
    // [GET] /admin/reviews
    async index(req, res) {
        try {
            const reviews = await Review.find({})
                .populate('user_id', 'fullname')
                .populate('product_id', 'name')
                .sort({ createdAt: -1 })
                .lean();
            res.render('admin/reviews', { reviews });
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // [POST] /admin/reviews/update
    async updateStatus(req, res) {
        try {
            const { id, status } = req.body;
            await Review.findByIdAndUpdate(id, { status: parseInt(status) });
            res.redirect('back');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // [GET] /admin/reviews/delete/:id
    async destroy(req, res) {
        try {
            await Review.findByIdAndDelete(req.params.id);
            res.redirect('back');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi xóa đánh giá');
        }
    }
}

module.exports = new ReviewController();
