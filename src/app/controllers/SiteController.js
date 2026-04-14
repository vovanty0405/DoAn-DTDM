// src/app/controllers/SiteController.js
const Category = require('../models/Category');
const Product = require('../models/Product'); 
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Review = require('../models/Review');
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const PromotionConfig = require('../models/PromotionConfig');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
class SiteController {
    // [GET] / (Trang chủ)
    async index(req, res) {
        try {
            const categories = await Category.find({ status: 1 }).lean();
            
            // HÀNG MỚI VỀ: 8 sản phẩm mới nhất
            const newProducts = await Product.find({ status: 1 })
                .sort({ createdAt: -1 })
                .limit(8)
                .lean();

            // Lấy config Khuyến Mãi
            let promoConfig = await PromotionConfig.findOne()
                 .populate('promo1_category_id')
                 .populate('promo2_category_id')
                 .populate('banner_category_id')
                 .lean();

            // BEST SELLER (Slot 1: Siêu sale cuối tuần)
            let saleProducts = [];
            if (promoConfig && promoConfig.promo1_category_id) {
                 saleProducts = await Product.find({
                      category_id: promoConfig.promo1_category_id._id,
                      status: 1,
                      discount_price: { $ne: null }
                 }).limit(4).lean();
            } else {
                 saleProducts = await Product.aggregate([
                    { $match: { status: 1, discount_price: { $ne: null } } },
                    { $addFields: { discount_amount: { $subtract: ["$price", "$discount_price"] } } },
                    { $sort: { discount_amount: -1 } },
                    { $limit: 4 }
                 ]);
            }

            // ƯU ĐÃI ĐỘC QUYỀN (Slot 2)
            let drinkProducts = [];
            if (promoConfig && promoConfig.promo2_category_id) {
                 drinkProducts = await Product.find({ 
                      category_id: promoConfig.promo2_category_id._id, 
                      status: 1
                 })
                 .limit(6)
                 .lean();
            } else {
                 const drinkCategory = await Category.findOne({ slug: 'nuoc-ngot', status: 1 }).lean();
                 if (drinkCategory) {
                     drinkProducts = await Product.find({ category_id: drinkCategory._id, status: 1 })
                     .limit(6).lean();
                 }
            }

            // GỢI Ý - PHÂN TRANG 8 SẢN PHẨM/TRANG
            const suggestPage = parseInt(req.query.suggest_page) || 1;
            const suggestLimit = 8;
            const suggestSkip = (suggestPage - 1) * suggestLimit;
            const totalSuggestItems = await Product.countDocuments({ status: 1 });
            const totalSuggestPages = Math.ceil(totalSuggestItems / suggestLimit);
            
            const recommendedProducts = await Product.find({ status: 1 })
                .sort({ createdAt: -1 })
                .skip(suggestSkip)
                .limit(suggestLimit)
                .lean();

            res.render('home', { 
                categories, 
                newProducts, 
                saleProducts, 
                drinkProducts,
                recommendedProducts,
                promoConfig,
                suggestPage,
                totalSuggestPages,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Chủ');
        }
    }

    // [GET] /about
    about(req, res) {
        res.render('about');
    }

    // [GET] /contact
    contact(req, res) {
        const contactSuccess = req.flash('contactSuccess');
        res.render('contact', { contactSuccess: contactSuccess[0] || null });
    }

    // [POST] /contact/store
    async storeContact(req, res) {
        try {
            const newContact = new Contact({
                name: req.body.name,
                email: req.body.email,
                title: req.body.title,
                content: req.body.content,
                status: 0
            });
            await newContact.save();
            req.flash('contactSuccess', 'Cảm ơn bạn! Yêu cầu của bạn đã được gửi. Chúng tôi sẽ sớm phản hồi.');
            res.redirect('/contact');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server khi gửi liên hệ');
        }
    }

    // [GET] /category/:slug — PHÂN TRANG 8 SP/TRANG + GIỮ FILTER URL
    async category(req, res) {
        try {
            const slug = req.params.slug; 
            const subcatId = req.query.subcat;
            const brandId = req.query.brand;
            const page = parseInt(req.query.page) || 1;
            const limit = 8;
            const skip = (page - 1) * limit;

            const currentCategory = await Category.findOne({ slug: slug, status: 1 }).lean();
            if (!currentCategory) return res.status(404).send('Không tìm thấy danh mục này!');

            const categories = await Category.find({ status: 1 }).lean();
            const subCategories = await SubCategory.find({ category_id: currentCategory._id }).lean();

            let filter = { category_id: currentCategory._id, status: 1 };
            if (subcatId) filter.sub_category_id = subcatId;
            if (brandId) filter.brand_id = brandId;

            // Đếm tổng và phân trang
            const totalItems = await Product.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);
            const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

            // Lấy danh sách Hãng
            const allProducts = await Product.find({ category_id: currentCategory._id, status: 1 }).lean();
            const brandIds = [...new Set(allProducts.map(p => p.brand_id && p.brand_id.toString()).filter(Boolean))];
            const brands = await Brand.find({ _id: { $in: brandIds } }).lean();

            // Khuyến mãi sốc
            const saleProducts = await Product.aggregate([
                { $match: { category_id: currentCategory._id, status: 1, discount_price: { $ne: null } } },
                { $addFields: { discount_amount: { $subtract: ["$price", "$discount_price"] } } },
                { $sort: { discount_amount: -1 } },
                { $limit: 4 }
            ]);

            res.render('category', { 
                categories, 
                currentCategory, 
                subCategories, 
                brands,        
                saleProducts,  
                products, 
                activeSubcat: subcatId,
                activeBrand: brandId,
                currentPage: page,
                totalPages,
            });

        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Danh Mục');
        }
    }

    // [GET] /search
    async search(req, res) {
        try {
            const keyword = req.query.keyword || '';
            const categories = await Category.find({ status: 1 }).lean();
            
            let products = [];
            if (keyword) {
                products = await Product.find({ 
                    name: { $regex: keyword, $options: 'i' }, 
                    status: 1 
                }).sort({ createdAt: -1 }).lean();
            }

            res.render('search', { categories, products, keyword });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Tìm Kiếm');
        }
    }

    // [GET] /product/:id — LÊN ĐỜI: Dynamic Rating + Real Sold Count + Verified Purchase + Nested Comments
    async productDetail(req, res) {
        try {
            const productId = req.params.id;
            
            const product = await Product.findById(productId).populate('category_id').lean();
            if (!product) return res.redirect('/');

            // Lấy danh sách đánh giá GỐC đã duyệt (parent_id = null)
            const reviews = await Review.find({ product_id: productId, status: 1, parent_id: null })
                                        .populate('user_id', 'fullname role')
                                        .sort({ createdAt: -1 })
                                        .lean();

            // Lấy tất cả REPLIES cho sản phẩm này
            const allReplies = await Review.find({ product_id: productId, status: 1, parent_id: { $ne: null } })
                                           .populate('user_id', 'fullname role')
                                           .sort({ createdAt: 1 })
                                           .lean();

            // Gắn replies vào review gốc tương ứng (Tree structure)
            reviews.forEach(review => {
                review.childReplies = allReplies.filter(
                    r => r.parent_id.toString() === review._id.toString()
                );
            });

            // === VERIFIED PURCHASERS: Tìm những user đã mua & hoàn thành đơn chứa sản phẩm này ===
            let verifiedUserIds = [];
            try {
                const verifiedOrders = await Order.find({
                    status: 3, // Hoàn thành
                    'items.product_id': new mongoose.Types.ObjectId(productId)
                }).select('user_id').lean();
                verifiedUserIds = verifiedOrders.map(o => o.user_id.toString());
            } catch(e) { /* Bỏ qua lỗi */ }

            // === DYNAMIC RATING STARS ===
            let avgRating = 5;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                avgRating = Math.round((totalRating / reviews.length) * 2) / 2;
            }

            // === REAL SOLD COUNT ===
            let soldCount = 0;
            try {
                const soldResult = await Order.aggregate([
                    { $match: { status: 3 } },
                    { $unwind: '$items' },
                    { $match: { 'items.product_id': new mongoose.Types.ObjectId(productId) } },
                    { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
                ]);
                if (soldResult.length > 0) {
                    soldCount = soldResult[0].totalSold;
                }
            } catch(e) { /* Bỏ qua lỗi aggregate */ }

            // SẢN PHẨM LIÊN QUAN
            const minPrice = product.price * 0.7;
            const maxPrice = product.price * 1.3;
            const relatedProducts = await Product.aggregate([
                { $match: { _id: { $ne: product._id }, status: 1 } },
                { 
                    $addFields: {
                        similarity_score: {
                            $add: [
                                { $cond: [ { $eq: ["$category_id", product.category_id._id] }, 5, 0 ] },
                                { $cond: [ { $and: [ { $gte: ["$price", minPrice] }, { $lte: ["$price", maxPrice] } ] }, 2, 0 ] }
                            ]
                        }
                    }
                },
                { $sort: { similarity_score: -1, createdAt: -1 } },
                { $limit: 50 }
            ]);

            const reviewSuccess = req.session ? req.session.reviewSuccess : null;
            if (req.session) req.session.reviewSuccess = null;

            res.render('product_detail', { 
                product, 
                reviews, 
                relatedProducts, 
                reviewSuccess,
                avgRating,
                soldCount,
                verifiedUserIds,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Chi Tiết');
        }
    }

    // [POST] /product/:id/review — Gửi đánh giá gốc (có chấm sao)
    async submitReview(req, res) {
        try {
            const productId = req.params.id;
            const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
            
            const userId = req.session.user ? req.session.user._id : null; 
            if (!userId) {
                if (isAjax) return res.status(401).json({ status: 'error', message: 'Bạn cần đăng nhập để đánh giá.' });
                return res.redirect('/product/' + productId);
            }

            // Kiểm tra xem user có đơn hàng Hoàn thành chứa sản phẩm này không
            const hasPurchased = await Order.findOne({
                user_id: userId,
                status: 3,
                'items.product_id': productId
            });

            if (!hasPurchased) {
                if (isAjax) {
                    return res.status(403).json({ status: 'error', message: 'Bạn cần mua và hoàn thành đơn hàng sản phẩm này để có thể đánh giá.' });
                }
                if (req.session) {
                    req.session.reviewSuccess = 'Bạn cần mua và hoàn thành đơn hàng sản phẩm này để có thể đánh giá.';
                }
                return res.redirect('/product/' + productId);
            }

            const newReview = new Review({
                product_id: productId,
                user_id: userId,
                rating: req.body.rating,
                comment: req.body.comment,
                status: 1,
                parent_id: null // Đánh giá gốc
            });
            await newReview.save();
            
            if (isAjax) {
                return res.json({ 
                    status: 'success', 
                    review: {
                        _id: newReview._id,
                        rating: newReview.rating,
                        comment: newReview.comment,
                        createdAt: newReview.createdAt.toLocaleString('vi-VN'),
                        user: {
                            fullname: req.session.user.fullname || req.session.user.full_name,
                            role: req.session.user.role
                        }
                    }
                });
            }

            if (req.session) req.session.reviewSuccess = 'Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được hiển thị.';
            res.redirect('/product/' + productId);
        } catch (error) {
            console.log(error);
            const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
            if (isAjax) return res.status(500).json({ status: 'error', message: 'Lỗi server khi gửi đánh giá.' });
            res.status(500).send('Lỗi khi gửi đánh giá');
        }
    }

    // [POST] /product/:id/review/reply — Trả lời bình luận (Nested comment)
    async replyReview(req, res) {
        try {
            const productId = req.params.id;
            const userId = req.session.user ? req.session.user._id : null;
            if (!userId) return res.redirect('/product/' + productId);

            const parentId = req.body.parent_id;
            const comment = req.body.comment;

            if (!comment || comment.trim() === '') {
                return res.redirect('/product/' + productId);
            }

            const reply = new Review({
                product_id: productId,
                user_id: userId,
                comment: comment,
                rating: null, // Reply không có chấm sao
                status: 1,
                parent_id: parentId
            });
            await reply.save();

            if (req.session) req.session.reviewSuccess = 'Phản hồi của bạn đã được gửi thành công!';
            res.redirect('/product/' + productId);
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi gửi phản hồi');
        }
    }

    // [GET] /orders — PHÂN TRANG 3 ĐƠN/TRANG
    async myOrders(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/');
            }
            const userId = req.session.user._id;
            const page = parseInt(req.query.page) || 1;
            const limit = 3;
            const skip = (page - 1) * limit;

            const totalItems = await Order.countDocuments({ user_id: userId });
            const totalPages = Math.ceil(totalItems / limit);

            const orders = await Order.find({ user_id: userId })
                                      .populate('items.product_id', 'name cover_image slug')
                                      .sort({ createdAt: -1 })
                                      .skip(skip)
                                      .limit(limit)
                                      .lean();

            res.render('my_orders', { orders, currentPage: page, totalPages });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Đơn Hàng');
        }
    }
    // [GET] /profile
    async profile(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/');
            }
            // Lấy dữ liệu user mới nhất từ DB
            const user = await User.findById(req.session.user._id).lean();
            if (!user) return res.redirect('/');

            const message = req.session.profileMessage;
            const error = req.session.profileError;
            delete req.session.profileMessage;
            delete req.session.profileError;

            res.render('profile', { user, message, error });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    }

    // [POST] /profile/update
    async updateProfile(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/');
            }

            const { fullname, address, current_password, new_password, confirm_password } = req.body;
            const user = await User.findById(req.session.user._id);

            // Cập nhật tên và địa chỉ
            if (fullname) user.fullname = fullname;
            if (address) user.address = address;

            // Xử lý đổi mật khẩu
            if (current_password || new_password || confirm_password) {
                if (!current_password || !new_password || !confirm_password) {
                    req.session.profileError = "Vui lòng điền đầy đủ các trường đổi mật khẩu.";
                    return res.redirect('/profile');
                }
                if (new_password !== confirm_password) {
                    req.session.profileError = "Mật khẩu mới không khớp.";
                    return res.redirect('/profile');
                }
                
                const validPassword = await bcrypt.compare(current_password, user.password);
                if (!validPassword) {
                    req.session.profileError = "Mật khẩu hiện tại không đúng.";
                    return res.redirect('/profile');
                }
                
                if (new_password.length < 6) {
                    req.session.profileError = "Mật khẩu mới phải có ít nhất 6 ký tự.";
                    return res.redirect('/profile');
                }

                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(new_password, salt);
            }

            await user.save();
            // Cập nhật session
            req.session.user.fullname = user.fullname;
            req.session.user.address = user.address;

            req.session.profileMessage = "Cập nhật tài khoản thành công!";
            res.redirect('/profile');
        } catch (error) {
            console.error(error);
            req.session.profileError = "Đã xảy ra lỗi, vui lòng thử lại sau.";
            res.redirect('/profile');
        }
    }
}

module.exports = new SiteController();