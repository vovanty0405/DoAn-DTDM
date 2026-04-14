const Order = require('../../app/models/Order');
const Product = require('../../app/models/Product');
const User = require('../../app/models/User');
const Notification = require('../../app/models/Notification');
const { sendOrderStatusEmail } = require('../../utils/mailer');

// Map trạng thái số sang text
const STATUS_MAP = {
    0: 'Mới đặt',
    1: 'Đang xử lý',
    2: 'Đang giao hàng',
    3: 'Hoàn thành',
    4: 'Đã hủy'
};

class OrderController {
    // 1. [GET] /admin/orders (Danh sách + Phân trang + Bộ lọc)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;

            // Xây dựng bộ lọc
            let filter = {};
            
            // Lọc theo trạng thái
            if (req.query.status !== undefined && req.query.status !== '') {
                filter.status = parseInt(req.query.status);
            }

            // Lọc theo ngày đặt
            if (req.query.from_date || req.query.to_date) {
                filter.createdAt = {};
                if (req.query.from_date) {
                    filter.createdAt.$gte = new Date(req.query.from_date);
                }
                if (req.query.to_date) {
                    let toDate = new Date(req.query.to_date);
                    toDate.setHours(23, 59, 59, 999);
                    filter.createdAt.$lte = toDate;
                }
            }

            // Tìm kiếm theo tên khách hàng
            if (req.query.keyword) {
                filter.fullname = { $regex: req.query.keyword, $options: 'i' };
            }

            // Sắp xếp
            let sortOption = { createdAt: -1 }; // Mặc định mới nhất
            if (req.query.sort === 'money_asc') {
                sortOption = { total_money: 1 };
            } else if (req.query.sort === 'money_desc') {
                sortOption = { total_money: -1 };
            }

            const totalItems = await Order.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);

            const orders = await Order.find(filter)
                .populate('user_id', 'email fullname')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean();
            
            res.render('admin/orders', { 
                orders, 
                currentPage: page, 
                totalPages,
                query: req.query 
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server khi tải danh sách đơn hàng');
        }
    }

    // 2. [POST] /admin/orders/update-status
    async updateStatus(req, res) {
        try {
            const { id, status } = req.body;
            const newStatus = parseInt(status);

            // Lấy đơn hàng cũ để so sánh trạng thái
            const order = await Order.findById(id).populate('user_id', 'email fullname');
            if (!order) return res.redirect('/admin/orders');

            const oldStatus = order.status;

            // ===== HOÀN TRẢ TỒN KHO NẾU CHUYỂN SANG TRẠNG THÁI HỦY (4) =====
            if (newStatus === 4 && oldStatus !== 4) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.product_id, {
                        $inc: { stock_quantity: item.quantity }
                    });
                }
            }

            // ===== TRỪ LẠI TỒN KHO NẾU KHÔI PHỤC TỪ TRẠNG THÁI HỦY =====
            if (oldStatus === 4 && newStatus !== 4) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.product_id, {
                        $inc: { stock_quantity: -item.quantity }
                    });
                }
            }

            // Cập nhật trạng thái đơn hàng
            await Order.findByIdAndUpdate(id, { status: newStatus });

            // ===== TẠO THÔNG BÁO WEB =====
            const statusText = STATUS_MAP[newStatus] || 'Không xác định';
            const shortId = order._id.toString().slice(-6).toUpperCase();

            if (order.user_id) {
                await Notification.create({
                    user_id: order.user_id._id,
                    message: `Đơn hàng #${shortId} đã chuyển sang trạng thái: ${statusText}`,
                    type: 'order',
                    order_id: order._id
                });

                // ===== GỬI EMAIL THÔNG BÁO =====
                if (order.user_id.email) {
                    const customerName = order.user_id.fullname || order.fullname;
                    // Gửi email bất đồng bộ (không chờ đợi để không làm chậm response)
                    sendOrderStatusEmail(order.user_id.email, customerName, order._id, statusText)
                        .catch(err => console.error('Lỗi gửi email:', err));
                }
            }

            res.redirect('/admin/orders');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // 3. [GET] /admin/orders/detail/:id
    async detail(req, res) {
        try {
            const order = await Order.findById(req.params.id)
                .populate('items.product_id')
                .lean();
                
            if (!order) {
                return res.status(404).send('Không tìm thấy đơn hàng này!');
            }

            res.render('admin/order_detail', { order });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server khi xem chi tiết đơn hàng');
        }
    }

    // 4. [GET] /admin/orders/delete/:id
    async destroy(req, res) {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) return res.redirect('/admin/orders');

            // ===== HOÀN TRẢ TỒN KHO KHI XÓA ĐƠN (nếu đơn chưa bị hủy) =====
            if (order.status !== 4) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.product_id, {
                        $inc: { stock_quantity: item.quantity }
                    });
                }
            }

            await Order.findByIdAndDelete(req.params.id);
            res.redirect('/admin/orders');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi xóa đơn hàng');
        }
    }
}

module.exports = new OrderController();