const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartController {
    // 1. [GET] /cart (Hiển thị trang giỏ hàng)
    async index(req, res) {
        try {
            let cartItems = [];

            // NẾU ĐÃ ĐĂNG NHẬP: Lấy từ Database
            if (req.session.user) {
                const carts = await Cart.find({ user_id: req.session.user._id })
                                        .populate('product_id')
                                        .lean();
                
                // Gom dữ liệu lại cho dễ hiển thị
                cartItems = carts.map(c => {
                    if (!c.product_id) return null; // Bỏ qua nếu sản phẩm đã bị xóa khỏi DB
                    return {
                        product_id: c.product_id._id,
                        name: c.product_id.name,
                        cover_image: c.product_id.cover_image,
                        price: c.product_id.discount_price || c.product_id.price, // Ưu tiên giá giảm
                        quantity: c.quantity,
                        stock_quantity: c.product_id.stock_quantity // Thêm thông tin tồn kho
                    };
                }).filter(item => item !== null);
            } 
            // NẾU CHƯA ĐĂNG NHẬP: Lấy từ Session
            else {
                const sessionCart = req.session.cart || {};
                const productIds = Object.keys(sessionCart);

                if (productIds.length > 0) {
                    // Dùng mảng ID trong Session để query lấy thông tin sản phẩm mới nhất
                    const products = await Product.find({ _id: { $in: productIds } }).lean();
                    
                    cartItems = products.map(p => ({
                        product_id: p._id,
                        name: p.name,
                        cover_image: p.cover_image,
                        price: p.discount_price || p.price,
                        quantity: sessionCart[p._id].quantity,
                        stock_quantity: p.stock_quantity
                    }));
                }
            }

            res.render('cart', { cartItems });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi tải giỏ hàng');
        }
    }

    // 2. [GET] /cart/remove/:id (Xóa sản phẩm)
    async remove(req, res) {
        try {
            const productId = req.params.id;
            
            if (req.session.user) {
                await Cart.findOneAndDelete({ user_id: req.session.user._id, product_id: productId });
            } else {
                if (req.session.cart && req.session.cart[productId]) {
                    delete req.session.cart[productId];
                }
            }
            res.redirect('/cart');
        } catch (error) {
            console.log(error);
            res.redirect('/cart');
        }
    }

    // 3. [POST] /cart/update (AJAX: Cập nhật số lượng)
    async update(req, res) {
        try {
            const productId = req.body.product_id;
            const quantity = parseInt(req.body.quantity);

            // ===== KIỂM TRA TỒN KHO KHI CẬP NHẬT SỐ LƯỢNG =====
            const product = await Product.findById(productId);
            if (product && quantity > product.stock_quantity) {
                return res.json({ 
                    status: 'error', 
                    message: `"${product.name}" chỉ còn ${product.stock_quantity} sản phẩm trong kho.` 
                });
            }

            if (req.session.user) {
                await Cart.findOneAndUpdate(
                    { user_id: req.session.user._id, product_id: productId },
                    { quantity: quantity }
                );
            } else {
                if (req.session.cart && req.session.cart[productId]) {
                    req.session.cart[productId].quantity = quantity;
                }
            }
            res.json({ status: 'success' });
        } catch (error) {
            res.json({ status: 'error' });
        }
    }

    // 4. [GET] /cart/buy-now/:id (Mua ngay: Thêm vào giỏ + redirect /cart)
    async buyNow(req, res) {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId);
            if (!product) return res.redirect('/');

            // ===== KIỂM TRA TỒN KHO TRƯỚC KHI MUA NGAY =====
            if (product.stock_quantity <= 0) {
                return res.send(`
                    <script>
                        alert('Sản phẩm "${product.name}" hiện đã hết hàng!');
                        window.history.back();
                    </script>
                `);
            }

            // Kiểm tra số lượng đã có trong giỏ
            let currentQty = 0;
            if (req.session.user) {
                const existingCart = await Cart.findOne({ user_id: req.session.user._id, product_id: productId });
                currentQty = existingCart ? existingCart.quantity : 0;
            } else {
                if (req.session.cart && req.session.cart[productId]) {
                    currentQty = req.session.cart[productId].quantity;
                }
            }

            if (currentQty + 1 > product.stock_quantity) {
                return res.send(`
                    <script>
                        alert('"${product.name}" chỉ còn ${product.stock_quantity} sản phẩm. Giỏ hàng đã có ${currentQty}.');
                        window.history.back();
                    </script>
                `);
            }

            if (req.session.user) {
                // Đã đăng nhập → Lưu vào DB
                const existingCart = await Cart.findOne({ user_id: req.session.user._id, product_id: productId });
                if (existingCart) {
                    existingCart.quantity += 1;
                    await existingCart.save();
                } else {
                    await Cart.create({ user_id: req.session.user._id, product_id: productId, quantity: 1 });
                }
            } else {
                // Chưa đăng nhập → Lưu vào Session
                if (!req.session.cart) req.session.cart = {};
                if (req.session.cart[productId]) {
                    req.session.cart[productId].quantity += 1;
                } else {
                    req.session.cart[productId] = { quantity: 1 };
                }
            }

            res.redirect('/cart');
        } catch (error) {
            console.log(error);
            res.redirect('/');
        }
    }
}

module.exports = new CartController();