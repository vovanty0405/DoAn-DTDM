var express = require('express');
var app = express();
//var session = require('express-session');
const session = require('express-session');
var path = require('path');
const db = require('./config/db');
const Cart = require('./app/models/Cart');
// Connect to MongoDB
db.connect();

app.use(session({
    secret: 'bachhoapew-secret-key', // Bạn có thể đổi chuỗi này tùy ý
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Phiên đăng nhập tồn tại 1 ngày
}));
// TẠO BIẾN TOÀN CỤC CHO USER VÀ SỐ LƯỢNG GIỎ HÀNG
app.use(async function(req, res, next) {
    res.locals.user = req.session.user || null;
    let totalCartCount = 0;
    
    try {
        if (req.session.user) {
            // Đếm cho người dùng đã đăng nhập
            const userId = req.session.user._id || req.session.user.id;
            const carts = await Cart.find({ user_id: userId }).lean();
            totalCartCount = carts.reduce((sum, item) => sum + (item.quantity || 1), 0);
        } else if (req.session.cart) {
            // Đếm cho khách vãng lai
            for (let key in req.session.cart) {
                totalCartCount += req.session.cart[key].quantity;
            }
        }
    } catch (err) {
        console.log('Lỗi đếm giỏ hàng ở file index:', err);
    }
    
    res.locals.cartCount = totalCartCount;
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'resources', 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public')));


const route = require('./routers');
route(app);


app.listen(3000, () => {
	console.log('Server is running at http://127.0.0.1:3000');
});