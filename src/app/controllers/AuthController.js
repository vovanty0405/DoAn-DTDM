const User = require('../models/User');
const Cart = require('../models/Cart');
const bcrypt = require('bcrypt'); // Thư viện mã hóa mật khẩu

class AuthController {
    // [POST] /auth/register
    async register(req, res) {
        try {
            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const newUser = new User({
                fullname: req.body.fullname,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                password: hashedPassword
            });

            await newUser.save();
            res.redirect('/'); // Đăng ký thành công, đẩy về trang chủ (bạn có thể thêm flash message sau)
        } catch (error) {
            req.flash('registerError', 'Lỗi đăng ký (Có thể email đã tồn tại)');
            res.redirect(req.header('Referer') || '/');
        }
    }

    // [POST] /auth/login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: email });

            if (!user) {
                req.flash('loginError', 'Tài khoản không tồn tại!');
                return res.redirect(req.header('Referer') || '/');
            }

            // So sánh mật khẩu người dùng nhập với mật khẩu mã hóa trong DB
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                req.flash('loginError', 'Sai mật khẩu!');
                return res.redirect(req.header('Referer') || '/');
            }

            // 1. GÁN THÔNG TIN USER VÀO SESSION
            req.session.user = user.toObject(); // Lưu toàn bộ thông tin user vào session (có thể rút gọn nếu muốn)

            // 2. LOGIC GỘP GIỎ HÀNG (MERGE CART TỪ SESSION VÀO DB)
            if (req.session.cart && Object.keys(req.session.cart).length > 0) {
                for (let productId in req.session.cart) {
                    const sessionQty = req.session.cart[productId].quantity;
                    
                    // Kiểm tra món đó đã có trong giỏ hàng DB của user này chưa
                    const existingCart = await Cart.findOne({ user_id: user._id, product_id: productId });
                    
                    if (existingCart) {
                        // Có rồi thì cộng dồn số lượng
                        existingCart.quantity += sessionQty;
                        await existingCart.save();
                    } else {
                        // Chưa có thì tạo mới
                        await Cart.create({
                            user_id: user._id,
                            product_id: productId,
                            quantity: sessionQty
                        });
                    }
                }
                // Gộp xong thì xóa giỏ hàng tạm đi cho nhẹ Session
                delete req.session.cart; 
            }

            // 3. ĐIỀU HƯỚNG DỰA THEO ROLE
            if (user.role === 1) {
                res.redirect('/admin/products');
            } else {
                res.redirect('/');
            }

        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // [GET] /logout
    logout(req, res) {
        req.session.destroy(); // Hủy toàn bộ session
        res.redirect('/');
    }
}

module.exports = new AuthController();