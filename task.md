# Task: Nâng cấp toàn diện Website Bách Hóa Pew V2

## Nhóm 0: Model Changes
- [x] Product.js - Thêm trường `images: [String]`
- [x] PromotionConfig.js - Thêm trường `banner_image`, `banner_category_id`

## Nhóm 1: Phân trang Admin (6 trang)
- [x] BrandController + brand.ejs
- [x] ProductController + product.ejs
- [x] CustomerController + customers.ejs
- [x] OrderController + orders.ejs
- [x] ReviewController + reviews.ejs
- [x] ContactController + contacts.ejs

## Nhóm 2: Phân trang Client
- [x] SiteController.myOrders + my_orders.ejs (3 đơn/trang)
- [x] SiteController.category + category.ejs (8 SP/trang, giữ filter URL)
- [x] SiteController.index + home.ejs (Gợi ý 8 SP/trang)

## Nhóm 3: Chi tiết Sản phẩm
- [x] Dynamic Rating Stars (tính trung bình sao)
- [x] Real Sold Count (aggregate từ orders)
- [x] Image Slider (Bootstrap Carousel + upload nhiều ảnh)
- [x] Nâng cấp UI đánh giá (Card, avatar, hover)

## Nhóm 4: Real-time Validation
- [x] Email validation on blur
- [x] Kiểm tra lỗi đăng nhập hiện trong Modal

## Nhóm 5: Nâng cấp Admin
- [x] Admin Đơn Hàng: Tìm kiếm + Lọc ngày + Lọc trạng thái + Sắp xếp
- [x] Admin Đánh Giá: Tìm kiếm + Lọc ngày

## Nhóm 6: Dynamic Banner
- [x] PromotionController + promotions.ejs (upload banner)
- [x] home.ejs (hiển thị banner động)
