// src/app/controllers/SiteController.js
const Category = require('../models/Category');
// Tạm thời require thêm Product nếu sau này bạn muốn đổ sản phẩm ra trang chủ
const Product = require('../models/Product'); 
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Review = require('../models/Review');

class SiteController {
    // [GET] / (Trang chủ)
    async index(req, res) {
        try {
            // 1. Lấy danh sách danh mục hiển thị
            const categories = await Category.find({ status: 1 }).lean();
            
            // 2. HÀNG MỚI VỀ: Lấy 8 sản phẩm mới nhất
            const newProducts = await Product.find({ status: 1 })
                .sort({ createdAt: -1 })
                .limit(8)
                .lean();

            // 3. BEST SELLER: Load 4 sản phẩm có giá giảm cao nhất
            // Chúng ta dùng aggregate để tính toán trực tiếp trên database
            const saleProducts = await Product.aggregate([
                { 
                    $match: { 
                        status: 1, 
                        discount_price: { $ne: null } // Lọc sản phẩm có giảm giá
                    } 
                },
                { 
                    $addFields: { 
                        // Tạo một trường tạm 'discount_amount' = giá gốc - giá giảm
                        discount_amount: { $subtract: ["$price", "$discount_price"] } 
                    } 
                },
                { 
                    $sort: { discount_amount: -1 } // Sắp xếp giảm dần theo số tiền được giảm
                },
                { 
                    $limit: 4 // Chỉ lấy 4 sản phẩm đầu tiên
                }
            ]);

            // 4. ƯU ĐÃI ĐỘC QUYỀN (NƯỚC NGỌT)
            const drinkCategory = await Category.findOne({ slug: 'nuoc-ngot', status: 1 }).lean();
            let drinkProducts = [];
            if (drinkCategory) {
                drinkProducts = await Product.find({ 
                    category_id: drinkCategory._id, 
                    status: 1 
                })
                .limit(6)
                .lean();
            }

            const cartCount = 0; 

            // 5. Render và truyền dữ liệu sang view home.ejs
            res.render('home', { 
                categories, 
                newProducts, 
                saleProducts, 
                drinkProducts,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Chủ');
        }
    }
    // [GET] /category/:slug (Trang danh sách sản phẩm theo danh mục)
    async category(req, res) {
        try {
            const slug = req.params.slug; 
            const subcatId = req.query.subcat; // Lấy ID thể loại con từ URL
            const brandId = req.query.brand;   // Lấy ID hãng từ URL

            const currentCategory = await Category.findOne({ slug: slug, status: 1 }).lean();
            if (!currentCategory) return res.status(404).send('Không tìm thấy danh mục này!');

            const categories = await Category.find({ status: 1 }).lean();
            const subCategories = await SubCategory.find({ category_id: currentCategory._id }).lean();

            // LƯU Ý QUAN TRỌNG: Tạo bộ lọc động
            let filter = { category_id: currentCategory._id, status: 1 };
            if (subcatId) filter.sub_category_id = subcatId; // Nếu có bấm vào thể loại con thì lọc thêm
            if (brandId) filter.brand_id = brandId;          // Nếu có bấm vào hãng thì lọc thêm

            // Lấy sản phẩm THEO BỘ LỌC
            const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

            // Để hiển thị danh sách tất cả các Hãng, ta cần lấy dựa trên TẤT CẢ sản phẩm của danh mục gốc (bỏ qua filter tạm thời)
            const allProducts = await Product.find({ category_id: currentCategory._id, status: 1 }).lean();
            const brandIds = [...new Set(allProducts.map(p => p.brand_id && p.brand_id.toString()).filter(Boolean))];
            const brands = await Brand.find({ _id: { $in: brandIds } }).lean();

            // Khuyến mãi sốc
            const saleProducts = await Product.aggregate([
                { $match: { category_id: currentCategory._id, status: 1, discount_price: { $ne: null } } },
                { $addFields: { discount_amount: { $subtract: ["$price", "$discount_price"] } } },
                { $sort: { discount_amount: -1 } },
                { $limit: 4 }
            ]);

            res.render('category', { 
                categories, 
                currentCategory, 
                subCategories, 
                brands,        
                saleProducts,  
                products, 
                activeSubcat: subcatId, // Gửi ra view để tô màu nút đang chọn
                activeBrand: brandId,   // Gửi ra view để tô màu nút đang chọn
               
            });

        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Danh Mục');
        }
    }
    // [GET] /search (Xử lý trang kết quả tìm kiếm)
    async search(req, res) {
        try {
            const keyword = req.query.keyword || ''; // Lấy chữ người dùng gõ vào
            const categories = await Category.find({ status: 1 }).lean();
            
            let products = [];
            if (keyword) {
                // Tìm kiếm bằng $regex (như lệnh LIKE '%...%' trong SQL), $options: 'i' để không phân biệt HOA/thường
                products = await Product.find({ 
                    name: { $regex: keyword, $options: 'i' }, 
                    status: 1 
                }).sort({ createdAt: -1 }).lean();
            }

            // Gửi dữ liệu ra file search.ejs
            res.render('search', { 
                categories, 
                products, 
                keyword, 
                
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Tìm Kiếm');
        }
    }
    // [GET] /product/:id (Trang chi tiết sản phẩm)
    async productDetail(req, res) {
        try {
            const productId = req.params.id;
            
            // 1. Lấy thông tin sản phẩm và danh mục của nó
            const product = await Product.findById(productId).populate('category_id').lean();
            if (!product) return res.redirect('/');

            // 2. Lấy danh sách đánh giá đã duyệt
            const reviews = await Review.find({ product_id: productId, status: 1 })
                                        .populate('user_id', 'fullname') // Kéo tên User sang
                                        .sort({ createdAt: -1 })
                                        .lean();

            // 3. THUẬT TOÁN TÌM SẢN PHẨM LIÊN QUAN (Mô phỏng lại logic PHP của bạn)
            const minPrice = product.price * 0.7;
            const maxPrice = product.price * 1.3;

            const relatedProducts = await Product.aggregate([
                { $match: { _id: { $ne: product._id }, status: 1 } }, // Trừ sản phẩm hiện tại ra
                { 
                    $addFields: {
                        similarity_score: {
                            $add: [
                                // Nếu cùng danh mục: +5 điểm
                                { $cond: [ { $eq: ["$category_id", product.category_id._id] }, 5, 0 ] },
                                // Nếu nằm trong khoảng giá 30%: +2 điểm
                                { $cond: [ { $and: [ { $gte: ["$price", minPrice] }, { $lte: ["$price", maxPrice] } ] }, 2, 0 ] }
                            ]
                        }
                    }
                },
                { $sort: { similarity_score: -1, createdAt: -1 } }, // Xếp theo điểm cao nhất
                { $limit: 50 } // Lấy tối đa 50 sản phẩm
            ]);

            // Lấy thông báo từ session (nếu vừa gửi đánh giá xong)
            const reviewSuccess = req.session ? req.session.reviewSuccess : null;
            if (req.session) req.session.reviewSuccess = null; // Xóa ngay để F5 không hiện lại

            res.render('product_detail', { 
                product, 
                reviews, 
                relatedProducts, 
                reviewSuccess,
               
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server ở Trang Chi Tiết');
        }
    }

    // [POST] /product/:id/review (Xử lý Gửi Đánh Giá)
    async submitReview(req, res) {
        try {
            const productId = req.params.id;
            
            // Lấy ID người dùng (Giả định bạn lưu user trong session khi đăng nhập)
            const userId = req.session.user ? req.session.user._id : null; 
            
            // Nếu chưa đăng nhập thì đẩy về lại trang
            if (!userId) return res.redirect('/product/' + productId);

            // Lưu đánh giá mới
            const newReview = new Review({
                product_id: productId,
                user_id: userId,
                rating: req.body.rating,
                comment: req.body.comment,
                status: 1
            });
            await newReview.save();
            
            // Tạo flash message báo thành công
            if (req.session) req.session.reviewSuccess = 'Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được hiển thị.';
            
            res.redirect('/product/' + productId);
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi gửi đánh giá');
        }
    }
}

module.exports = new SiteController();