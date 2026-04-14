# Tài liệu Yêu cầu Nâng cấp Hệ thống Website Bách Hóa Pew
---
## 1. Nâng cấp Giao diện Khung Đánh giá (Review UI/UX)
**Mục tiêu:** Làm cho phần hiển thị danh sách đánh giá trở nên chuyên nghiệp và bắt mắt hơn thay vì danh sách thuần túy.

- **Yêu cầu giao diện:**
    - Sử dụng **Bootstrap Card** hoặc một container có đổ bóng nhẹ (`shadow-sm`).
    - Phân chia bố cục rõ ràng: 
        - Bên trái: Tên khách hàng (Avatar chữ cái đầu) + Nhãn "Đã mua hàng".
        - Bên phải: Số sao (màu vàng), ngày tháng và nội dung bình luận.
    - Thêm hiệu ứng hover vào khung đánh giá để tăng tính tương tác.

---

## 2. Cập nhật Quản lý Quảng cáo (Dynamic Category Banner)
**Mục tiêu:** Cho phép Admin thay đổi Banner tại khu vực "Banner Danh Mục" và liên kết nó với một danh mục cụ thể.

- **Cấu trúc Database:** Cập nhật bảng `promotions` để quản lý thêm 
- **Trang Admin:**
    - Thêm khu vực tải lên hình ảnh cho Banner Danh Mục.
    - Thêm Dropdown chọn danh mục muốn liên kết.
- **Trang chủ/Giao diện người dùng:**
    - Đổ dữ liệu ảnh từ database ra section banner.
    - Bọc hình ảnh trong thẻ `<a>` với đường dẫn trỏ về trang danh mục tương ứng.
    - Đảm bảo hình ảnh hiển thị chuẩn Responsive (không bị méo ảnh trên điện thoại).

---
