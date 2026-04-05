// var indexRouter = require('./routers/index');
//var productRouter = require('./routers/product');
var adminRouter = require('./admin');
var homeRouter = require('./home');
var siteRouter = require('./site');
var apiRouter = require('./api');
const authRouter = require('./auth');
const cartRouter = require('./cart');
const authController = require('../app/controllers/AuthController');

function route(app) {
    //app.use('/', indexRouter);
    //app.use('/product', productRouter);
    app.use('/auth', authRouter);
    app.get('/logout', authController.logout); // Route đăng xuất trực tiếp
    app.use('/admin', adminRouter);
    app.use('/api', apiRouter);  
    app.use('/home', homeRouter);
    app.use('/cart', cartRouter);
   
    app.use('/', siteRouter);
}

module.exports = route;

