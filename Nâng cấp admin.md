# Tài liệu Yêu cầu: Nâng cấp Bộ lọc và Tìm kiếm trang Quản trị (Admin)

Dựa trên cấu trúc cơ sở dữ liệu hiện tại (bảng `orders`, `customers`, `reviews`, `products`), cần nâng cấp trải nghiệm quản lý dữ liệu thông qua các bộ lọc thông minh và tìm kiếm thời gian thực.

---

## 1. Nâng cấp Trang Quản lý Đơn hàng
**Mục tiêu:** Giúp quản trị viên nhanh chóng tìm thấy đơn hàng trong danh sách dài và thống kê doanh thu hiệu quả.

### A. Tìm kiếm Live Search (AJAX)
- **Tính năng:** Nhập tên khách hàng vào ô tìm kiếm, kết quả danh sách đơn hàng tự động lọc và hiển thị ngay lập tức (không cần tải lại trang).
- **Logic:** Truy vấn `JOIN` giữa bảng `orders` và `customers` dựa trên cột `full_name`.

### B. Bộ lọc theo Ngày đặt
- **Tính năng:** Cho phép chọn khoảng ngày (Từ ngày... Đến ngày...).
- **Logic:** Sử dụng mệnh đề `WHERE DATE(order_date) BETWEEN ? AND ?`.

### C. Sắp xếp và Lọc trạng thái
- **Sắp xếp Tổng tiền:** Thêm nút hoặc Dropdown để sắp xếp theo `total_money` (Tăng dần/Giảm dần).
- **Lọc Trạng thái:** Lọc đơn hàng theo các trạng thái: Chờ xác nhận (0), Đang xử lý (1), Đang giao (2), Hoàn thành (3), Đã hủy (4).

---

## 2. Nâng cấp Trang Quản lý Đánh giá
**Mục tiêu:** Kiểm soát phản hồi của khách hàng chặt chẽ hơn.

### A. Tìm kiếm đa năng
- **Theo tên người đánh giá:** Tìm kiếm dựa trên cột `fullname` từ bảng `users`.
- **Theo tên sản phẩm:** Tìm kiếm dựa trên cột `name` từ bảng `products`.

### B. Lọc theo Thời gian
- **Tính năng:** Lọc các đánh giá được gửi trong một khoảng thời gian cụ thể (cột `created_at`).

---

## 3. Yêu cầu Kỹ thuật chung
- **Backend:** Sử dụng `Prepared Statements` trong PHP để xử lý các tham số tìm kiếm nhằm chống tấn công SQL Injection.
- **Frontend:** - Sử dụng **JavaScript (Fetch API hoặc AJAX)** cho tính năng tìm kiếm "nhập tới đâu hiện tới đó".
    - Giữ nguyên thiết kế bảng của Bootstrap hiện có nhưng bổ sung thêm hàng (row) chứa các Input/Select phục vụ cho việc lọc ở phía trên bảng.
- **Trải nghiệm người dùng:** Nếu không tìm thấy kết quả sau khi lọc, phải hiển thị dòng thông báo: *"Không tìm thấy dữ liệu phù hợp."*

---
