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
                        quantity: c.quantity
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
                        quantity: sessionCart[p._id].quantity
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
}

module.exports = new CartController();