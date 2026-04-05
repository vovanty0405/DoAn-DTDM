const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

class CheckoutController {
    // [GET] /checkout
    async index(req, res) {
        try {
            // Chỉ cho phép thanh toán nếu đã đăng nhập
            if (!req.session.user) return res.redirect('/#loginModal');

            const userId = req.session.user._id;
            const carts = await Cart.find({ user_id: userId }).populate('product_id').lean();

            if (!carts || carts.length === 0) return res.redirect('/cart');

            // Tính tổng tiền từ dữ liệu thật trong Database
            let totalMoney = 0;
            carts.forEach(item => {
                const price = item.product_id.discount_price || item.product_id.price;
                totalMoney += price * item.quantity;
            });

            res.render('checkout', { carts, totalMoney });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi trang thanh toán');
        }
    }

    // [POST] /checkout/place-order
    async placeOrder(req, res) {
        try {
            const userId = req.session.user._id;
            const { fullname, phone, address, payment_method } = req.body;

            // 1. Lấy lại giỏ hàng để kiểm tra sản phẩm
            const carts = await Cart.find({ user_id: userId }).populate('product_id').lean();
            if (!carts || carts.length === 0) return res.redirect('/cart');

            let totalMoney = 0;
            let orderItems = [];

            // 2. Chuyển đổi dữ liệu giỏ hàng sang định dạng đơn hàng
            carts.forEach(item => {
                const price = item.product_id.discount_price || item.product_id.price;
                totalMoney += price * item.quantity;
                
                orderItems.push({
                    product_id: item.product_id._id,
                    price: price,
                    quantity: item.quantity
                });
            });

            // 3. Tạo Document đơn hàng mới
            const order = new Order({
                user_id: userId,
                fullname,
                phone,
                address,
                payment_method,
                total_money: totalMoney,
                status: 0, // 0: Mới đặt
                items: orderItems
            });

            await order.save();

            // 4. Xóa sạch giỏ hàng của khách sau khi đặt thành công
            await Cart.deleteMany({ user_id: userId });

            // 5. Thông báo và chuyển hướng
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