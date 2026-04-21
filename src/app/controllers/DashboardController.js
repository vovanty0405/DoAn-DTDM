const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

class DashboardController {
    // [GET] /admin/dashboard
    async index(req, res) {
        try {
            // Lấy thời gian hiện tại
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            // 1. Tổng doanh thu (tất cả các đơn hàng đã giao hoặc thanh toán thành công)
            const orders = await Order.find({ status: { $in: [2, 3] } }).populate('user_id');
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total_money || 0), 0);
            
            // 2. Trung bình đơn hàng
            const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
            
            // 3. Khách hàng mới (trong tháng)
            const newCustomersCount = await Customer.countDocuments({ createdAt: { $gte: startOfMonth } });
            
            // 4. Sản phẩm tồn kho thấp (< 5)
            const lowStockProducts = await Product.find({ stock_quantity: { $lt: 5 } }).limit(10);
            
            // 5. Dữ liệu biểu đồ Doanh thu theo ngày (7 ngày gần nhất)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const revenueByDay = {};
            const orderCountByDay = {};
            last7Days.forEach(day => {
                revenueByDay[day] = 0;
                orderCountByDay[day] = 0;
            });
            
            orders.forEach(order => {
                const orderDay = order.createdAt.toISOString().split('T')[0];
                if(revenueByDay[orderDay] !== undefined) {
                    revenueByDay[orderDay] += (order.total_money || 0);
                    orderCountByDay[orderDay] += 1;
                }
            });

            // Tạo mảng chi tiết cho bảng
            const revenueByDate = last7Days.map(day => ({
                date: day,
                orderCount: orderCountByDay[day],
                totalAmount: revenueByDay[day]
            })).reverse();

            const revenueData = Object.values(revenueByDay);
            const revenueLabels = Object.keys(revenueByDay);

            res.render('admin/dashboard', {
                layout: 'admin/layout',
                title: 'Bảng Điều Khiển (Dashboard)',
                totalRevenue,
                averageOrderValue,
                newCustomersCount,
                lowStockProducts,
                revenueByDate,
                revenueLabels: JSON.stringify(revenueLabels),
                revenueData: JSON.stringify(revenueData),
                user: req.session.user || req.user
            });
        } catch (error) {
            console.error('Error Dashboard:', error);
            res.status(500).send(`<pre>${error.stack}</pre>`);
        }
    }
}

module.exports = new DashboardController();
