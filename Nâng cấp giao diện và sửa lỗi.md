1: Đồng nhất Header & Giao diện Sidebar Trái
Mục tiêu: Sửa lỗi Dropdown và cấu trúc lại Layout trang chủ/danh mục.

"Tôi đang làm dự án Node.js/Express (EJS). Hãy giúp tôi thực hiện các yêu cầu sau:

Đồng nhất Header: Hiện tại dropdown danh mục chỉ hoạt động ở trang chủ do dữ liệu categories chỉ được truyền ở route /. Hãy viết một Middleware trong file index.js để tự động lấy dữ liệu Category.find() và gán vào res.locals.categories, giúp Header ở mọi trang (Chi tiết, Giỏ hàng, Tìm kiếm) đều hiển thị được danh mục.

Layout Sidebar Trái: Thay đổi cấu trúc trang home.ejs và category.ejs. Sử dụng hệ thống Grid của Bootstrap:

Cột trái (col-md-3): Hiển thị danh sách Danh mục theo chiều dọc (Vertical Menu), bo tròn các góc, có đổ bóng nhẹ (shadow) và màu sắc đồng bộ với thương hiệu.

Cột phải (col-md-9): Hiển thị Banner và các Section sản phẩm (Best Seller, Hàng mới...).

Styling: Viết CSS để các Section sản phẩm có màu nền riêng biệt (ví dụ: xanh nhạt cho rau củ, vàng nhạt cho khuyến mãi), bo tròn góc (border-radius: 15px) để tạo cảm giác hiện đại."

2: Nâng cấp Hệ thống Đánh giá (Review 2.0)
Mục tiêu: Chặn đánh giá ảo, thêm tính năng phản hồi từ Admin.

"Hãy nâng cấp logic đánh giá sản phẩm cho dự án của tôi:

Phân quyền đánh giá: Chỉnh sửa hàm submitReview trong SiteController.js. Trước khi cho phép lưu đánh giá, hãy kiểm tra trong bảng Order: Nếu người dùng hiện tại đã có đơn hàng ở trạng thái 'Hoàn thành' (status = 3) và trong đơn hàng đó có chứa product_id này thì mới cho phép đánh giá. Nếu không, hiển thị thông báo: 'Bạn cần mua sản phẩm này để có thể đánh giá'.

Tính năng Phản hồi (Reply): >    - Cập nhật Model Review.js: Thêm một trường replies là một mảng các Object (gồm user_id, comment, createdAt).

Viết logic phía Admin để Admin có thể nhập nội dung trả lời cho từng đánh giá của khách.

Giao diện: Nâng cấp file product_detail.ejs phần đánh giá. Thiết kế khung đánh giá chuyên nghiệp hơn, hiển thị rõ phần phản hồi của cửa hàng lùi vào một khoảng so với đánh giá gốc."

3: Mô tả chi tiết sản phẩm & Quản lý Admin
Mục tiêu: Hỗ trợ mô tả sản phẩm đẹp mắt (Rich Text) và hiển thị chuyên nghiệp.

"Tôi muốn cải thiện phần mô tả sản phẩm cho đẹp mắt hơn:

Phía Admin: Trong trang thêm/sửa sản phẩm, hãy hướng dẫn tôi tích hợp thư viện Quill.js hoặc CKEditor vào thẻ <textarea name="description">. Việc này giúp tôi có thể định dạng chữ (Bold, Italic), tạo danh sách (Bullet points) hoặc chèn thêm ảnh nhỏ vào nội dung mô tả.

Phía Client: Cập nhật trang product_detail.ejs để hiển thị nội dung mô tả từ Database dưới dạng HTML (sử dụng cú pháp <%- product.description %> thay vì <%= %>).

Thiết kế: Tạo một Tab UI (Sử dụng Bootstrap Tabs) để chia tách giữa 'Mô tả sản phẩm', 'Thông số kỹ thuật' và 'Đánh giá' giúp trang chi tiết sản phẩm gọn gàng và chuyên nghiệp như Tiki."