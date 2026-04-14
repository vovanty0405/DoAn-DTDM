const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

class CheckoutController {
    // [GET] /checkout
    async index(req, res) {
        try {
            // Chỉ cho phép thanh toán nếu đã đăng nhập
            if (!req.session.user) return res.redirect('/#loginModal');

            const userId = req.session.user._id;
            const carts = await Cart.find({ user_id: userId }).populate('product_id').lean();

            if (!carts || carts.length === 0) return res.redirect('/cart');

            // ===== KIỂM TRA TỒN KHO TRƯỚC KHI HIỆN TRANG CHECKOUT =====
            let stockErrors = [];
            carts.forEach(item => {
                if (item.product_id && item.quantity > item.product_id.stock_quantity) {
                    stockErrors.push(`"${item.product_id.name}" chỉ còn ${item.product_id.stock_quantity} sản phẩm trong kho.`);
                }
            });

            if (stockErrors.length > 0) {
                // Redirect về giỏ hàng kèm thông báo lỗi
                return res.send(`
                    <script>
                        alert('Không thể thanh toán:\\n${stockErrors.join('\\n')}');
                        window.location.href = '/cart';
                    </script>
                `);
            }

            // Tính tổng tiền từ dữ liệu thật trong Database
            let totalMoney = 0;
            carts.forEach(item => {
                const price = item.product_id.discount_price || item.product_id.price;
                totalMoney += price * item.quantity;
            });

            // Sinh sẵn một Order ID để frontend tạo QR Code
            const newOrderId = new mongoose.Types.ObjectId();

            res.render('checkout', { carts, totalMoney, newOrderId });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi trang thanh toán');
        }
    }

    // [POST] /checkout/place-order
    async placeOrder(req, res) {
        try {
            const userId = req.session.user._id;
            const { fullname, phone, address, payment_method, order_id } = req.body;

            // 1. Lấy lại giỏ hàng để kiểm tra sản phẩm
            const carts = await Cart.find({ user_id: userId }).populate('product_id').lean();
            if (!carts || carts.length === 0) return res.redirect('/cart');

            // ===== 2. KIỂM TRA TỒN KHO LẦN CUỐI TRƯỚC KHI ĐẶT HÀNG =====
            let stockErrors = [];
            for (const item of carts) {
                // Lấy dữ liệu mới nhất từ DB (tránh race condition)
                const freshProduct = await Product.findById(item.product_id._id);
                if (!freshProduct) {
                    stockErrors.push(`Sản phẩm "${item.product_id.name}" không còn tồn tại.`);
                    continue;
                }
                if (item.quantity > freshProduct.stock_quantity) {
                    stockErrors.push(`"${freshProduct.name}" chỉ còn ${freshProduct.stock_quantity} sản phẩm.`);
                }
            }

            if (stockErrors.length > 0) {
                return res.send(`
                    <script>
                        alert('Không thể đặt hàng:\\n${stockErrors.join('\\n')}');
                        window.location.href = '/cart';
                    </script>
                `);
            }

            let totalMoney = 0;
            let orderItems = [];

            // 3. Chuyển đổi dữ liệu giỏ hàng sang định dạng đơn hàng
            carts.forEach(item => {
                const price = item.product_id.discount_price || item.product_id.price;
                totalMoney += price * item.quantity;
                
                orderItems.push({
                    product_id: item.product_id._id,
                    price: price,
                    quantity: item.quantity
                });
            });

            // 4. Tạo Document đơn hàng mới
            const orderDoc = {
                user_id: userId,
                fullname,
                phone,
                address,
                payment_method,
                total_money: totalMoney,
                status: (payment_method === 'VietQR') ? 1 : 0, // VietQR cho lên Đang xử lý
                items: orderItems
            };

            // Nếu frontend có truyền lên order_id tạo sẵn
            if (order_id) {
                orderDoc._id = order_id;
            }

            const order = new Order(orderDoc);
            await order.save();

            // ===== 5. TRỪ TỒN KHO SAU KHI ĐẶT HÀNG THÀNH CÔNG =====
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(item.product_id, {
                    $inc: { stock_quantity: -item.quantity }
                });
            }

            // 6. Xóa sạch giỏ hàng của khách sau khi đặt thành công
            await Cart.deleteMany({ user_id: userId });

            // 7. Thông báo và chuyển hướng
            res.send(`
                <script>
                    alert('Đơn hàng đã được tiếp nhận! Mã ĐH: #${order._id.toString().slice(-6).toUpperCase()}');
                    window.location.href = '/';
                </script>
            `);

        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi xử lý đặt hàng');
        }
    }
}

module.exports = new CheckoutController();