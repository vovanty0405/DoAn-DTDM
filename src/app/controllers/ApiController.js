const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Category = require('../models/Category');
class ApiController {
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
                
                const currentCategory = await Category.findOne({ slug: categorySlug, status: 1 }).lean();
                if (currentCategory) {
                    let filter = { category_id: currentCategory._id, status: 1 };
                    if (subcatId) filter.sub_category_id = subcatId;
                    if (brandId) filter.brand_id = brandId;

                    products = await Product.find(filter)
                        .sort({ createdAt: -1 })
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

            // TRƯỜNG HỢP 1: KHÁCH ĐÃ ĐĂNG NHẬP (Lưu vào Database)
            if (req.session.user) {
                // Lấy ID người dùng từ Session (hỗ trợ cả định dạng _id hoặc id)
                const userId = req.session.user._id || req.session.user.id;
                
                // Tìm xem sản phẩm này đã có trong giỏ của User này chưa
                const existingCart = await Cart.findOne({ user_id: userId, product_id: productId });
                
                if (existingCart) {
                    // Nếu có rồi thì tăng số lượng lên
                    existingCart.quantity += quantity;
                    await existingCart.save();
                } else {
                    // Nếu chưa có thì tạo mới một dòng trong bảng Cart
                    await Cart.create({ 
                        user_id: userId, 
                        product_id: productId, 
                        quantity: quantity 
                    });
                }

                // Sau khi lưu xong, đếm lại tổng số lượng của toàn bộ giỏ hàng trong DB
                const carts = await Cart.find({ user_id: userId }).lean();
                totalCartCount = carts.reduce((sum, item) => sum + (item.quantity || 0), 0);
            } 
            // TRƯỜNG HỢP 2: KHÁCH VÃNG LAI (Lưu tạm vào Session)
            else {
                if (!req.session.cart) req.session.cart = {};
                
                if (req.session.cart[productId]) {
                    req.session.cart[productId].quantity += quantity;
                } else {
                    req.session.cart[productId] = {
                        product_id: productId,
                        quantity: quantity
                    };
                }

                // Đếm tổng số lượng từ Session
                for (let key in req.session.cart) {
                    totalCartCount += req.session.cart[key].quantity;
                }
            }

            // Trả kết quả về cho JavaScript ở giao diện để cập nhật con số đỏ trên icon giỏ hàng
            return res.json({ 
                status: 'success', 
                cart_count: totalCartCount 
            });

        } catch (error) {
            console.error("Lỗi khi thêm giỏ hàng:", error);
            return res.status(500).json({ status: 'error', message: 'Không thể thêm sản phẩm vào giỏ' });
        }
    }
}

module.exports = new ApiController();