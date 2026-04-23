const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const StockSubscription = require('../models/StockSubscription');
const User = require('../models/User');
const Voucher = require('../models/Voucher');

class ApiController {
    // [GET] /api/auth/check
    async checkAuthExists(req, res) {
        try {
            const { type, value } = req.query; // type: 'email' hoặc 'phone'
            if (!type || !value) {
                return res.json({ exists: false });
            }

            let query = {};
            query[type] = value;
            
            const user = await User.findOne(query);
            res.json({ exists: !!user });
        } catch (error) {
            console.error("Lỗi checkAuthExists:", error);
            res.json({ exists: false });
        }
    }

    // [GET] /api/products/load-more
    async loadMoreProducts(req, res) {
        try {
            const type = req.query.type; // 'sale' hoặc 'new' hoặc 'category'
            const offset = parseInt(req.query.offset) || 0;
            const limit = type === 'category' ? 8 : 4; // Bấm xem thêm trong category load 8
            let products = [];

            if (type === 'sale') {
                // Tải thêm sản phẩm sale
                const PromotionConfig = require('../models/PromotionConfig');
                let config = await PromotionConfig.findOne();
                if (config && config.promo1_category_id) {
                     products = await Product.find({
                          category_id: config.promo1_category_id,
                          status: 1,
                          discount_price: { $ne: null }
                     }).skip(offset).limit(limit).lean();
                } else {
                     products = await Product.aggregate([
                         { $match: { status: 1, discount_price: { $ne: null } } },
                         { $addFields: { discount_amount: { $subtract: ["$price", "$discount_price"] } } },
                         { $sort: { discount_amount: -1 } },
                         { $skip: offset }, 
                         { $limit: limit }
                     ]);
                }
            } else if (type === 'drink' || type === 'promo2') { 
                // Tải thêm sản phẩm ưu đãi độc quyền
                const PromotionConfig = require('../models/PromotionConfig');
                let config = await PromotionConfig.findOne();
                if (config && config.promo2_category_id) {
                     products = await Product.find({ 
                          category_id: config.promo2_category_id, 
                          status: 1 
                      })
                     .skip(offset).limit(6).lean(); // Drink limit is 6
                } else {
                     const drinkCategory = await Category.findOne({ slug: 'nuoc-ngot' }).lean();
                     if (drinkCategory) {
                         products = await Product.find({ category_id: drinkCategory._id, status: 1 })
                             .skip(offset).limit(6).lean();
                     }
                }
            } else if (type === 'new') {
                // Tương tự Hàng Mới Về nhưng có thêm hàm skip()
                products = await Product.find({ status: 1 })
                    .sort({ createdAt: -1 })
                    .skip(offset)
                    .limit(limit)
                    .lean();
            } else if (type === 'category') {
                const categorySlug = req.query.categorySlug;
                const subcatId = req.query.subcat;
                const brandId = req.query.brand;
                const minPrice = req.query.minPrice;
                const maxPrice = req.query.maxPrice;
                const sort = req.query.sort || 'newest';
                
                const currentCategory = await Category.findOne({ slug: categorySlug, status: 1 }).lean();
                if (currentCategory) {
                    let filter = { category_id: currentCategory._id, status: 1 };
                    if (subcatId) filter.sub_category_id = subcatId;
                    if (brandId) filter.brand_id = brandId;
                    
                    if (minPrice || maxPrice) {
                        filter.price = {};
                        if (minPrice) filter.price.$gte = parseInt(minPrice);
                        if (maxPrice) filter.price.$lte = parseInt(maxPrice);
                    }

                    let sortQuery = { createdAt: -1 };
                    if (sort === 'price-asc') sortQuery = { price: 1 };
                    else if (sort === 'price-desc') sortQuery = { price: -1 };
                    else if (sort === 'selling') sortQuery = { createdAt: -1 };

                    products = await Product.find(filter)
                        .sort(sortQuery)
                        .skip(offset)
                        .limit(limit)
                        .lean();
                }
            }

            // Nếu không còn sản phẩm nào để load thêm
            if (products.length === 0) {
                return res.send(''); // Trả về chuỗi rỗng để báo hiệu cho Javascript biết đã hết
            }

            // Dùng res.render để biên dịch file ejs phụ thành HTML và gửi về cho Javascript
            res.render('partials/product_list', { products, type }, (err, html) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('');
                }
                res.send(html); // Gửi đoạn code HTML đã nối dữ liệu về giao diện
            });

        } catch (error) {
            console.log(error);
            res.status(500).send('');
        }
    }

    // [GET] /api/cart/add?id=...
    async addToCart(req, res) {
        try {
            const productId = req.query.id;
            const quantity = 1;
            let totalCartCount = 0;

            // ===== KIỂM TRA TỒN KHO TRƯỚC KHI THÊM GIỎ =====
            const product = await Product.findById(productId);
            if (!product) {
                return res.json({ status: 'error', message: 'Sản phẩm không tồn tại.' });
            }

            // Tính tổng số lượng đã có trong giỏ cho sản phẩm này
            let currentQtyInCart = 0;
            if (req.session.user) {
                const existingCart = await Cart.findOne({ user_id: req.session.user._id, product_id: productId });
                currentQtyInCart = existingCart ? existingCart.quantity : 0;
            } else {
                if (req.session.cart && req.session.cart[productId]) {
                    currentQtyInCart = req.session.cart[productId].quantity;
                }
            }

            if (currentQtyInCart + quantity > product.stock_quantity) {
                return res.json({ 
                    status: 'error', 
                    message: product.stock_quantity <= 0 
                        ? `"${product.name}" hiện đã hết hàng!` 
                        : `"${product.name}" chỉ còn ${product.stock_quantity} sản phẩm. Giỏ hàng đã có ${currentQtyInCart}.`
                });
            }

            if (req.session.user) {
                const userId = req.session.user._id || req.session.user.id;
                const existingCart = await Cart.findOne({ user_id: userId, product_id: productId });
                
                if (existingCart) {
                    existingCart.quantity += quantity;
                    await existingCart.save();
                } else {
                    await Cart.create({ user_id: userId, product_id: productId, quantity: quantity });
                }
                const carts = await Cart.find({ user_id: userId }).lean();
                totalCartCount = carts.reduce((sum, item) => sum + (item.quantity || 0), 0);
            } else {
                if (!req.session.cart) req.session.cart = {};
                if (req.session.cart[productId]) {
                    req.session.cart[productId].quantity += quantity;
                } else {
                    req.session.cart[productId] = { product_id: productId, quantity: quantity };
                }
                for (let key in req.session.cart) {
                    totalCartCount += req.session.cart[key].quantity;
                }
            }

            return res.json({ status: 'success', cart_count: totalCartCount });
        } catch (error) {
            console.error("Lỗi khi thêm giỏ hàng:", error);
            return res.status(500).json({ status: 'error', message: 'Không thể thêm sản phẩm vào giỏ' });
        }
    }

    // [GET] /api/search/suggest
    async suggestSearch(req, res) {
        try {
            const keyword = req.query.keyword || '';
            if (!keyword.trim()) {
                return res.json([]);
            }
            
            // Tìm 5 sản phẩm khớp với từ khoá
            const products = await Product.find({ 
                name: { $regex: keyword, $options: 'i' }, 
                status: 1 
            }).select('name cover_image price discount_price slug').limit(5).lean();

            res.json(products);
        } catch(error) {
            console.error(error);
            res.status(500).json([]);
        }
    }

    // [GET] /api/search/suggested-products — Sản phẩm gợi ý cho Search Modal
    async suggestedProducts(req, res) {
        try {
            // Lấy 8 sản phẩm mới nhất hoặc có giảm giá
            const products = await Product.find({ 
                status: 1, 
                stock_quantity: { $gt: 0 } 
            })
            .select('name cover_image price discount_price')
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

            res.json(products);
        } catch(error) {
            console.error(error);
            res.json([]);
        }
    }

    // ===== NOTIFICATION APIs =====

    // [GET] /api/notifications/count — Số thông báo chưa đọc
    async notificationCount(req, res) {
        try {
            if (!req.session.user) return res.json({ count: 0 });
            const count = await Notification.countDocuments({ 
                user_id: req.session.user._id, 
                is_read: false 
            });
            res.json({ count });
        } catch (error) {
            res.json({ count: 0 });
        }
    }

    // [GET] /api/notifications — Lấy danh sách thông báo (10 gần nhất)
    async notificationList(req, res) {
        try {
            if (!req.session.user) return res.json([]);
            const notifications = await Notification.find({ user_id: req.session.user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            res.json(notifications);
        } catch (error) {
            res.json([]);
        }
    }

    // [POST] /api/notifications/mark-read — Đánh dấu tất cả đã đọc
    async markNotificationsRead(req, res) {
        try {
            if (!req.session.user) return res.json({ status: 'error' });
            await Notification.updateMany(
                { user_id: req.session.user._id, is_read: false },
                { is_read: true }
            );
            res.json({ status: 'success' });
        } catch (error) {
            res.json({ status: 'error' });
        }
    }

    // [POST] /api/stock-subscribe — Đăng ký nhận thông báo khi có hàng
    async stockSubscribe(req, res) {
        try {
            if (!req.session.user) {
                return res.json({ status: 'error', message: 'Vui lòng đăng nhập để đăng ký.' });
            }
            const productId = req.body.product_id || req.query.product_id;
            
            // Kiểm tra đã đăng ký chưa
            const existing = await StockSubscription.findOne({ 
                user_id: req.session.user._id, 
                product_id: productId 
            });
            
            if (existing) {
                return res.json({ status: 'info', message: 'Bạn đã đăng ký theo dõi sản phẩm này rồi!' });
            }

            await StockSubscription.create({
                user_id: req.session.user._id,
                product_id: productId
            });

            res.json({ status: 'success', message: 'Đã đăng ký! Chúng tôi sẽ thông báo khi có hàng.' });
        } catch (error) {
            console.error(error);
            res.json({ status: 'error', message: 'Lỗi hệ thống.' });
        }
    }

    // [POST] /api/voucher/save
    async saveVoucher(req, res) {
        try {
            if (!req.session.user) {
                return res.json({ status: 'error', message: 'Vui lòng đăng nhập để lưu mã giảm giá' });
            }

            const { voucher_id } = req.body;
            if (!voucher_id) return res.json({ status: 'error', message: 'Thiếu thông tin voucher' });

            const user = await User.findById(req.session.user._id);
            if (!user) return res.json({ status: 'error', message: 'Người dùng không tồn tại' });

            // Initialize saved_vouchers if it doesn't exist
            if (!user.saved_vouchers) {
                user.saved_vouchers = [];
            }

            // Check if already saved
            if (user.saved_vouchers.includes(voucher_id)) {
                return res.json({ status: 'error', message: 'Bạn đã lưu mã giảm giá này rồi' });
            }

            // Optional: check voucher validity and usage limit
            const voucher = await Voucher.findById(voucher_id);
            if (!voucher || !voucher.status) {
                return res.json({ status: 'error', message: 'Mã giảm giá không hợp lệ' });
            }

            if (new Date() > voucher.expiry_date) {
                return res.json({ status: 'error', message: 'Mã giảm giá đã hết hạn' });
            }

            // Usage limit conceptually refers to how many times it can be *used*. 
            // If we also want to limit how many people can *save* it, we'd need a saved_count field.
            // For now, we just save it.

            user.saved_vouchers.push(voucher_id);
            await user.save();

            // Update session so user data is fresh
            req.session.user = user;

            res.json({ status: 'success', message: 'Lưu mã thành công!' });

        } catch (error) {
            console.error(error);
            res.json({ status: 'error', message: 'Lỗi hệ thống khi lưu mã' });
        }
    }

    // [GET] /api/voucher/my-vouchers
    async getMyVouchers(req, res) {
        try {
            if (!req.session.user) {
                return res.json({ status: 'error', message: 'Vui lòng đăng nhập' });
            }
            
            const user = await User.findById(req.session.user._id).populate({
                path: 'saved_vouchers',
                match: { status: true }
            }).lean();

            if (!user) return res.json({ status: 'error', message: 'Người dùng không tồn tại' });

            const validVouchers = (user.saved_vouchers || []).filter(v => {
                if (!v) return false;
                if (new Date() > new Date(v.expiry_date)) return false;
                if (v.usage_limit > 0 && v.used_count >= v.usage_limit) return false;
                return true;
            });

            res.json({ status: 'success', data: validVouchers });

        } catch (error) {
            console.error(error);
            res.json({ status: 'error', message: 'Lỗi hệ thống' });
        }
    }

    // [POST] /api/voucher/validate
    async validateVoucher(req, res) {
        try {
            const { code, order_total } = req.body;
            if (!code) return res.json({ status: 'error', message: 'Vui lòng nhập mã giảm giá' });

            const voucher = await Voucher.findOne({ code: code.toUpperCase(), status: true });
            if (!voucher) {
                return res.json({ status: 'error', message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
            }

            if (new Date() > voucher.expiry_date) {
                return res.json({ status: 'error', message: 'Mã giảm giá đã hết hạn' });
            }

            if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
                return res.json({ status: 'error', message: 'Mã giảm giá đã hết lượt sử dụng' });
            }

            if (order_total < voucher.min_order_value) {
                return res.json({ status: 'error', message: `Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')}đ để áp dụng mã này` });
            }

            // Kiểm tra category_id (Scope)
            if (voucher.category_id && req.session.user) {
                // Lấy giỏ hàng
                const carts = await Cart.find({ user_id: req.session.user._id }).populate('product_id').lean();
                const hasCategoryProduct = carts.some(item => 
                    item.product_id && 
                    item.product_id.category_id && 
                    item.product_id.category_id.toString() === voucher.category_id.toString()
                );
                
                if (!hasCategoryProduct) {
                    return res.json({ status: 'error', message: 'Mã giảm giá không áp dụng cho các sản phẩm trong giỏ hàng' });
                }
            } else if (voucher.category_id && !req.session.user) {
                return res.json({ status: 'error', message: 'Vui lòng đăng nhập để kiểm tra điều kiện mã' });
            }

            let discountAmount = 0;
            if (voucher.discount_type === 'fixed') {
                discountAmount = voucher.discount_value;
            } else if (voucher.discount_type === 'percent') {
                discountAmount = (order_total * voucher.discount_value) / 100;
                if (voucher.max_discount_amount > 0 && discountAmount > voucher.max_discount_amount) {
                    discountAmount = voucher.max_discount_amount;
                }
            }

            res.json({
                status: 'success',
                message: 'Áp dụng mã thành công!',
                data: {
                    code: voucher.code,
                    discount_amount: discountAmount
                }
            });

        } catch (error) {
            console.error(error);
            res.json({ status: 'error', message: 'Lỗi hệ thống khi kiểm tra mã' });
        }
    }

    // [GET] /api/vouchers/public
    async getAllPublicVouchers(req, res) {
        try {
            const vouchers = await Voucher.find({ 
                status: true,
                expiry_date: { $gt: new Date() }
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
            
            res.json({ status: 'success', data: vouchers });
        } catch (error) {
            console.error(error);
            res.json({ status: 'error', data: [] });
        }
    }
}

module.exports = new ApiController();