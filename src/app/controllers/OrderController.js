const Order = require('../../app/models/Order');

class OrderController {
    // 1. [GET] /admin/orders (Hiển thị danh sách đơn hàng)
    async index(req, res) {
        try {
            // Lấy tất cả đơn hàng, nối với bảng User để lấy Email người đặt
            const orders = await Order.find({})
                .populate('user_id', 'email fullname')
                .sort({ createdAt: -1 })
                .lean();
            
            res.render('admin/orders', { orders });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server khi tải danh sách đơn hàng');
        }
    }

    // 2. [POST] /admin/orders/update-status (Cập nhật trạng thái: Mới đặt -> Đang giao...)
    async updateStatus(req, res) {
        try {
            const { id, status } = req.body;
            await Order.findByIdAndUpdate(id, { status: parseInt(status) });
            res.redirect('/admin/orders');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi cập nhật trạng thái');
        }
    }

    // 3. [GET] /admin/orders/detail/:id (Xem chi tiết để In Hóa Đơn)
    async detail(req, res) {
        try {
            // "Populate" sâu vào mảng items để lấy thông tin sản phẩm (Tên, Ảnh)
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

    // 4. [GET] /admin/orders/delete/:id (Xóa đơn hàng nếu cần)
    async destroy(req, res) {
        try {
            await Order.findByIdAndDelete(req.params.id);
            res.redirect('/admin/orders');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi xóa đơn hàng');
        }
    }
}

module.exports = new OrderController();