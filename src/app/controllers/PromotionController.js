const Category = require('../models/Category');
const Product = require('../models/Product');
const PromotionConfig = require('../models/PromotionConfig');

class PromotionController {
    // Hiển thị giao diện quản lý
    async index(req, res) {
        try {
            const categories = await Category.find({ status: 1 }).lean();
            
            // Lấy config hiện tại, nếu chưa có thì tạo mới dòng đầu tiên
            let config = await PromotionConfig.findOne();
            if (!config) {
                config = await PromotionConfig.create({});
            }

            // Gửi message nếu có
            const successMsg = req.flash('successMsg');
            const errorMsg = req.flash('errorMsg');

            res.render('admin/promotions', { 
                categories, 
                config,
                successMsg: successMsg[0] || null,
                errorMsg: errorMsg[0] || null
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi máy chủ');
        }
    }

    // Cập nhật Slot 1 (Siêu sale cuối tuần)
    async updateSlot1(req, res) {
        try {
            const { category_id, percent } = req.body;
            const isCancel = req.body.action === 'cancel';

            let config = await PromotionConfig.findOne();
            if (!config) config = await PromotionConfig.create({});

            // 1. Phục hồi giá gốc cho danh mục của Slot 1 CŨ (Nếu có)
            if (config.promo1_category_id && config.promo1_category_id.toString() !== (isCancel ? '' : category_id)) {
                await Product.updateMany(
                    { category_id: config.promo1_category_id },
                    { $set: { discount_price: null } }
                );
            }

            if (isCancel) {
                // Xóa nốt luôn nếu Hủy trên chính danh mục đó
                if (config.promo1_category_id) {
                     await Product.updateMany(
                        { category_id: config.promo1_category_id },
                        { $set: { discount_price: null } }
                    );
                }
                config.promo1_category_id = null;
                config.promo1_percent = 0;
                await config.save();
                req.flash('successMsg', 'Đã hủy Sale Siêu sale cuối tuần và khôi phục giá gốc.');
            } else {
                // ÁP DỤNG SALE: Khôi phục giá cũ của Category Mới trước (đề phòng nó trùng slot khác)
                await Product.updateMany(
                    { category_id: category_id },
                    { $set: { discount_price: null } }
                );

                // Tính toán giá bằng vòng lặp javascript để làm tròn chính xác tuyệt đối
                const products = await Product.find({ category_id: category_id, status: 1 });
                for (let p of products) {
                    let discountValue = Math.round(p.price * (percent / 100)); // số tiền được giảm
                    p.discount_price = p.price - discountValue; // Giá sau khi giảm
                    await p.save();
                }

                config.promo1_category_id = category_id;
                config.promo1_percent = percent;
                await config.save();
                req.flash('successMsg', 'Đã áp dụng Siêu sale cuối tuần thành công!');
            }

            res.redirect('/admin/promotions');
        } catch (error) {
            console.error(error);
            req.flash('errorMsg', 'Có lỗi xảy ra khi cập nhật Slot 1');
            res.redirect('/admin/promotions');
        }
    }

    // Cập nhật Slot 2 (Ưu đãi độc quyền)
    async updateSlot2(req, res) {
        try {
            const { category_id, percent } = req.body;
            const isCancel = req.body.action === 'cancel';

            let config = await PromotionConfig.findOne();
            if (!config) config = await PromotionConfig.create({});

            // 1. Phục hồi giá gốc cho danh mục của Slot 2 CŨ (Nếu có)
            if (config.promo2_category_id && config.promo2_category_id.toString() !== (isCancel ? '' : category_id)) {
                await Product.updateMany(
                    { category_id: config.promo2_category_id },
                    { $set: { discount_price: null } }
                );
            }

            if (isCancel) {
                if (config.promo2_category_id) {
                     await Product.updateMany(
                        { category_id: config.promo2_category_id },
                        { $set: { discount_price: null } }
                    );
                }
                config.promo2_category_id = null;
                config.promo2_percent = 0;
                await config.save();
                req.flash('successMsg', 'Đã hủy Ưu đãi độc quyền và khôi phục giá gốc.');
            } else {
                // Áp dụng lại
                await Product.updateMany(
                    { category_id: category_id },
                    { $set: { discount_price: null } }
                );

                const products = await Product.find({ category_id: category_id, status: 1 });
                for (let p of products) {
                    let discountValue = Math.round(p.price * (percent / 100));
                    p.discount_price = p.price - discountValue;
                    await p.save();
                }

                config.promo2_category_id = category_id;
                config.promo2_percent = percent;
                await config.save();
                req.flash('successMsg', 'Đã áp dụng Ưu đãi độc quyền thành công!');
            }

            res.redirect('/admin/promotions');
        } catch (error) {
            console.error(error);
            req.flash('errorMsg', 'Có lỗi xảy ra khi cập nhật Slot 2');
            res.redirect('/admin/promotions');
        }
    }
}

module.exports = new PromotionController();
