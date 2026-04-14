# Tài liệu Yêu cầu: Nâng cấp Hệ thống Xác thực, Phân trang và Slider Sản phẩm

Dựa trên cấu trúc dự án hiện tại, cần thực hiện các nâng cấp về mặt logic xử lý dữ liệu và giao diện người dùng để tăng tính chuyên nghiệp và độ tin cậy của Website Bách Hóa Pew.

---


## 1. Xác thực thời gian thực (Real-time Validation)
- **Lỗi Email:** Khi người dùng nhập sai định dạng email hoặc email không tồn tại, ngay khi họ nhấn phím `Tab` hoặc click sang ô Mật khẩu, hệ thống phải hiển thị dòng chữ đỏ báo lỗi ngay dưới ô Email (không dùng alert).
- **Lỗi Đăng nhập:** Nếu sai mật khẩu, thông báo lỗi phải xuất hiện trực tiếp trong Modal đăng nhập, giữ nguyên form để khách hàng nhập lại thay vì dùng hàm `alert()` gây ngắt quãng trải nghiệm.

---

## 2. Nâng cấp Trang Danh mục & Gợi ý (`category.php`, `index.php`)
**Mục tiêu:** Tối ưu tốc độ tải trang và cách sắp xếp sản phẩm.

- **Hiển thị:** Phần "Gợi ý cho bạn" chỉ hiển thị tối đa **8 sản phẩm**.
- **Phân trang (Pagination):** - Loại bỏ nút "Xem thêm" kiểu cũ.
    - Thêm thanh phân trang Bootstrap: `[Trang trước] [1] [2] [3] ... [Trang sau]`.
    - Đảm bảo khi chuyển trang, các bộ lọc danh mục và hãng hiện tại vẫn được giữ nguyên trên URL.

---

## 3. Nâng cấp Trang Chi tiết Sản phẩm
**Mục tiêu:** Tăng độ sinh động và giúp khách hàng quan sát sản phẩm từ nhiều góc độ.

- **Slider Hình ảnh (Image Carousel):**
    - Thay thế khung ảnh tĩnh bằng **Bootstrap Carousel** hoặc **Swiper.js**.
    - **Tính năng:**
        - Tự động chuyển ảnh (Auto-play) sau mỗi 5 giây.
        - Hỗ trợ nút điều hướng Trái/Phải.
        - Đồng bộ Thumbnail: Khi nhấn vào các ảnh nhỏ bên dưới, ảnh chính phía trên phải trượt sang hình tương ứng một cách mượt mà.

---
