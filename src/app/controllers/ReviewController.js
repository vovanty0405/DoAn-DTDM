const Review = require('../models/Review');
const Order = require('../models/Order');

class ReviewController {
    // [GET] /admin/reviews (Phân trang + Tìm kiếm + Lọc ngày)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            // Xây dựng pipeline aggregate để hỗ trợ tìm kiếm theo tên User/Product
            let matchStage = {};

            // Lọc theo ngày
            if (req.query.from_date || req.query.to_date) {
                matchStage.createdAt = {};
                if (req.query.from_date) {
                    matchStage.createdAt.$gte = new Date(req.query.from_date);
                }
                if (req.query.to_date) {
                    let toDate = new Date(req.query.to_date);
                    toDate.setHours(23, 59, 59, 999);
                    matchStage.createdAt.$lte = toDate;
                }
            }

            // Chỉ lấy đánh giá gốc (không bao gồm reply)
            let filter = { ...matchStage, parent_id: null };

            let totalItems;
            let reviews;

            if (req.query.keyword) {
                // Tìm kiếm phức tạp: cần populate rồi mới filter
                let allReviews = await Review.find(filter)
                    .populate('user_id', 'fullname role')
                    .populate('product_id', 'name')
                    .populate('replies.user_id', 'fullname role')
                    .sort({ createdAt: -1 })
                    .lean();
                
                const keyword = req.query.keyword.toLowerCase();
                allReviews = allReviews.filter(r => {
                    const userName = r.user_id ? r.user_id.fullname.toLowerCase() : '';
                    const productName = r.product_id ? r.product_id.name.toLowerCase() : '';
                    return userName.includes(keyword) || productName.includes(keyword);
                });

                totalItems = allReviews.length;
                reviews = allReviews.slice(skip, skip + limit);
            } else {
                totalItems = await Review.countDocuments(filter);
                reviews = await Review.find(filter)
                    .populate('user_id', 'fullname role')
                    .populate('product_id', 'name')
                    .populate('replies.user_id', 'fullname role')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean();
            }

            // Lấy nested replies (parent_id based) cho mỗi review
            for (let review of reviews) {
                review.childReplies = await Review.find({ parent_id: review._id, status: 1 })
                    .populate('user_id', 'fullname role')
                    .sort({ createdAt: 1 })
                    .lean();
            }

            const totalPages = Math.ceil(totalItems / limit);
            res.render('admin/reviews', { reviews, currentPage: page, totalPages, query: req.query });
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
            res.redirect('/admin/reviews');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // [GET] /admin/reviews/delete/:id
    async destroy(req, res) {
        try {
            // Xóa cả đánh giá gốc lẫn replies con
            await Review.deleteMany({ parent_id: req.params.id });
            await Review.findByIdAndDelete(req.params.id);
            res.redirect('/admin/reviews');
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi khi xóa đánh giá');
        }
    }

    // [POST] /admin/reviews/reply/:id — Admin trả lời (lưu dưới dạng nested comment)
    async reply(req, res) {
        try {
            const { reply_comment } = req.body;
            const reviewId = req.params.id;

            // Đảm bảo session còn tồn tại và user hợp lệ, và PHẢI LÀ ADMIN
            // (Nếu không check role, người dùng mở nhiều tab test có thể bị lấy nhầm session Customer)
            if (!req.session || !req.session.user || req.session.user.role !== 1) {
                return res.redirect('/admin/reviews');
            }

            const adminId = req.session.user._id;

            if (reply_comment && reply_comment.trim() !== '') {
                // Tìm review gốc để lấy product_id
                const parentReview = await Review.findById(reviewId);
                if (parentReview) {
                    // CẬP NHẬT: Lưu reply dưới dạng nested comment (parent_id)
                    const reply = new Review({
                        product_id: parentReview.product_id,
                        user_id: adminId, // Luôn lưu ID của Admin
                        comment: reply_comment,
                        rating: null,
                        status: 1,
                        parent_id: reviewId
                    });
                    
                    // Nếu vì lý do gì Mongoose check lỗi, sử dụng try-catch riêng để không văng app
                    try {
                        await reply.save();
                    } catch (saveError) {
                        console.error('Lỗi lưu reply Mongoose:', saveError.message);
                    }
                }
            }
            res.redirect('/admin/reviews');
        } catch (error) {
            console.log("Lỗi ở ReviewController reply:", error);
            res.redirect('/admin/reviews');
        }
    }
}

module.exports = new ReviewController();
