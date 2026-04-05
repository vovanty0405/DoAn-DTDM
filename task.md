# Kế hoạch Hoàn thiện Chức năng Liên hệ & Đánh Giá

## 1. Cơ sở dữ liệu
- [x] Tạo model `Contact.js`

## 2. Phía Người dùng (User)
- [x] Tạo `about.ejs` (Giới thiệu)
- [x] Tạo `contact.ejs` (Form liên hệ)
- [x] Cập nhật `partials/navbar.ejs` (Thêm link)
- [x] Cập nhật controller `SiteController.js` & `routers/site.js`

## 3. Quản lý Liên hệ (Admin)
- [x] Tạo controller `ContactController.js`
- [x] Tạo view bảng `admin/contacts.ejs`
- [x] Cập nhật route `admin.js`

## 4. Quản lý Đánh Giá (Admin)
- [x] Tạo controller `ReviewController.js`
- [x] Tạo view bảng `admin/reviews.ejs`
- [x] Cập nhật route `admin.js`

## 5. Cập nhật giao diện Admin Sidebar chung
- [x] Thêm link Liên hệ & Đánh giá vào tất cả các màn hình admin .ejs cũ

## 6. Kế Hoạch Cập Nhật Fix Lỗi & Đơn Hàng (Sprint 2)
### Xử lý lỗi Đăng nhập
- [x] Sửa `AuthController.js`: Cập nhật `res.redirect` xử lý Referer Header.
### Giao diện Review (product detail)
- [x] Cập nhật `product_detail.ejs`: Ẩn bớt review > 5, thêm nút Load More.
### Quản lý Đơn Hàng (Client)
- [x] Khai báo route `/orders` vào `routers/site.js`.
- [x] Tạo hàm `myOrders` trong `SiteController.js`.
- [x] Tạo giao diện My Orders `my_orders.ejs` hiện đại.

## 7. Sprint 3: Tính năng Quản Lý Khuyến Mãi (Admin) 
- [x] Tạo Model `PromotionConfig.js`.
- [x] Tạo file `PromotionController.js` và code hàm `index`, `updateSlot`.
- [x] Render file giao diện form Admin `promotions.ejs` và gắn link Sidebar.
- [x] Khai báo route trong `routers/admin.js`.
- [x] Cập nhật `SiteController.js` (Hàm index) để Load 2 danh mục động từ config cấu hình.
- [x] Sửa lại UI `home.ejs` nhận tham số Động.
- [x] Sửa lại hàm xem thêm `loadMoreProducts` API.
