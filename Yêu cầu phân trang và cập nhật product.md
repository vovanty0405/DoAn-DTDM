# Tài liệu Yêu cầu: Nâng cấp Phân trang và Logic Hiển thị Chi tiết Sản phẩm

Dựa trên cấu trúc dự án hiện tại, cần thực hiện nâng cấp đồng bộ hệ thống quản trị và giao diện người dùng để tối ưu hóa hiệu suất tải trang và tính xác thực của dữ liệu.

---

## 1. Nâng cấp Phân trang (Pagination) Toàn diện
**Mục tiêu:** Giảm tải cho trình duyệt và máy chủ bằng cách chia nhỏ dữ liệu hiển thị.

### A. Phân trang phía Admin
- **Áp dụng cho các trang:** Quản lý Hãng sản xuất, Sản phẩm, Khách hàng, Đơn hàng, Đánh giá và Liên hệ.
- **Yêu cầu:** - Mỗi trang chỉ hiển thị tối đa **10 dòng dữ liệu** (đối với sản phẩm có thể để 8).
    - Phía dưới bảng phải có thanh điều hướng phân trang (Pagination Bar) của Bootstrap: `[Trang trước] [1] [2] [3] ... [Trang sau]`.

### B. Phân trang phía Người dùng (Client)
- **Trang Đơn hàng của tôi:** Chỉ hiển thị **3 đơn hàng** gần nhất.
- **Phần "Gợi ý cho bạn":** Tại các trang danh mục hoặc trang chủ, chỉ hiển thị **8 sản phẩm**. Nếu khách hàng muốn xem thêm, sử dụng phân trang để chuyển qua các bộ 8 sản phẩm tiếp theo thay vì nút "Xem thêm" kiểu cũ.

---

## 2. Nâng cấp Trang Chi tiết Sản phẩm
**Mục tiêu:** Tăng độ tin cậy và tính sinh động cho sản phẩm.

### A. Logic Hiển thị Sao Đánh giá (Dynamic Rating Stars)
- **Yêu cầu:** - Nếu sản phẩm **chưa có đánh giá**: Mặc định hiển thị **5 sao**.
    - Nếu sản phẩm **đã có đánh giá**: 
        - Truy vấn bảng `reviews` để lấy tất cả `rating` của sản phẩm đó.
        - Tính giá trị trung bình cộng (Average).
        - Hiển thị số sao vàng tương ứng với kết quả trung bình (làm tròn đến 0.5).

### B. Hiệu ứng Ảnh chuyển động (Image Slider/Animation)
- **Yêu cầu:** Thay thế khung ảnh tĩnh hiện tại bằng một **Slider** (có thể dùng Bootstrap Carousel hoặc thư viện như Swiper/Slick).
- **Tính năng:** Tự động chuyển ảnh (nếu sản phẩm có nhiều ảnh) hoặc cho phép khách hàng nhấn vào các ảnh thumbnail nhỏ bên dưới để ảnh chính trượt qua một cách mượt mà.

### C. Hiển thị Dữ liệu Bán hàng Thật (Real Sold Count)
- **Logic:** - Thực hiện câu lệnh SQL `SUM(quantity)` từ bảng `order_details` với điều kiện `product_id` tương ứng.
    - Chỉ đếm những đơn hàng có trạng thái `status = 3` (Hoàn thành) trong bảng `orders`.
- **Giao diện:** Thay thế con số "128 (Dữ liệu giả lập)" bằng biến `$sold_count` thực tế lấy từ Database.

---
