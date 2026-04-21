const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const StockSubscription = require('../models/StockSubscription');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendBackInStockEmail } = require('../../utils/mailer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

class ProductController {
    // [GET] /admin/products (Phân trang 8 SP/trang)
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 8;
            const skip = (page - 1) * limit;

            // TẠO BỘ LỌC TÌM KIẾM CHO ADMIN
            let filter = {};
            if (req.query.keyword) {
                filter.name = { $regex: req.query.keyword, $options: 'i' };
            }
            if (req.query.category_id) {
                filter.category_id = req.query.category_id;
            }

            // Đếm tổng và lấy dữ liệu phân trang
            const totalItems = await Product.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);

            const products = await Product.find(filter)
                .populate('category_id')
                .populate('sub_category_id')
                .populate('brand_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const categories = await Category.find({ status: 1 }).lean();
            const subCategories = await SubCategory.find({}).populate('category_id').lean();
            const brands = await Brand.find({}).lean();

            res.render('admin/product', { 
                products, categories, subCategories, brands, 
                query: req.query,
                currentPage: page, 
                totalPages 
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi Server');
        }
    }

    // [POST] /admin/products/store (Hỗ trợ multi-image upload)
    async store(req, res) {
        try {
            const formData = req.body;
            // Ảnh đại diện (cover_image) - file đầu tiên từ input name="cover_image"
            if (req.files && req.files['cover_image'] && req.files['cover_image'][0]) {
                formData.cover_image = 'uploads/' + req.files['cover_image'][0].filename;
            } else if (req.file) {
                formData.cover_image = 'uploads/' + req.file.filename;
            }

            // Mảng ảnh phụ (images) - từ input name="images"
            if (req.files && req.files['images']) {
                formData.images = req.files['images'].map(f => 'uploads/' + f.filename);
            }
            
            if(!formData.discount_price) formData.discount_price = null;
            if(!formData.sub_category_id) formData.sub_category_id = null;

            const newProduct = new Product(formData);
            await newProduct.save();
            res.redirect('/admin/products');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi thêm sản phẩm');
        }
    }

    // [POST] /admin/products/update (Hỗ trợ multi-image upload + Back-in-stock notification)
    async update(req, res) {
        try {
            const formData = req.body;
            
            if (req.files && req.files['cover_image'] && req.files['cover_image'][0]) {
                formData.cover_image = 'uploads/' + req.files['cover_image'][0].filename;
            } else if (req.file) {
                formData.cover_image = 'uploads/' + req.file.filename;
            }

            // Ảnh phụ mới (nếu có upload)
            if (req.files && req.files['images'] && req.files['images'].length > 0) {
                formData.images = req.files['images'].map(f => 'uploads/' + f.filename);
            }

            if(!formData.discount_price) formData.discount_price = null;
            if(!formData.sub_category_id) formData.sub_category_id = null;

            // ===== KIỂM TRA STOCK 0 → >0 ĐỂ THÔNG BÁO KHÁCH HÀNG =====
            const oldProduct = await Product.findById(req.body.id);
            const newStockQty = parseInt(formData.stock_quantity) || 0;
            const oldStockQty = oldProduct ? oldProduct.stock_quantity : 0;

            await Product.findByIdAndUpdate(req.body.id, formData);

            // Nếu trước đó hết hàng (0) và bây giờ có hàng (>0) → Gửi thông báo
            if (oldStockQty <= 0 && newStockQty > 0 && oldProduct) {
                const subscriptions = await StockSubscription.find({ product_id: oldProduct._id })
                    .populate('user_id', 'email fullname')
                    .lean();

                for (const sub of subscriptions) {
                    if (sub.user_id) {
                        // Tạo thông báo web
                        await Notification.create({
                            user_id: sub.user_id._id,
                            message: `🎉 Sản phẩm "${oldProduct.name}" đã có hàng trở lại! Nhanh tay đặt mua ngay.`,
                            type: 'stock'
                        });

                        // Gửi email (bất đồng bộ)
                        if (sub.user_id.email) {
                            sendBackInStockEmail(
                                sub.user_id.email, 
                                sub.user_id.fullname, 
                                oldProduct.name, 
                                oldProduct._id
                            ).catch(err => console.error('Lỗi gửi email back-in-stock:', err));
                        }
                    }
                }

                // Xóa tất cả subscription sau khi đã thông báo
                await StockSubscription.deleteMany({ product_id: oldProduct._id });
            }

            res.redirect('/admin/products');
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi khi cập nhật');
        }
    }

    // [GET] /admin/products/delete/:id
    async destroy(req, res) {
        try {
            await Product.findByIdAndDelete(req.params.id);
            // Xóa luôn subscriptions liên quan
            await StockSubscription.deleteMany({ product_id: req.params.id });
            res.redirect('/admin/products');
        } catch (error) {
            res.status(500).send('Lỗi khi xóa');
        }
    }

    // [GET] /admin/products/export
    async exportExcel(req, res) {
        try {
            const products = await Product.find({}).populate('category_id').populate('sub_category_id').populate('brand_id').lean();
            
            const data = products.map((p, index) => ({
                STT: index + 1,
                Name: p.name,
                Price: p.price,
                DiscountPrice: p.discount_price || 0,
                Stock: p.stock_quantity,
                Category: p.category_id ? p.category_id.name : '',
                SubCategory: p.sub_category_id ? p.sub_category_id.name : '',
                Brand: p.brand_id ? p.brand_id.name : '',
                Status: p.status === 1 ? 'Đang bán' : 'Ngừng bán'
            }));

            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Products");

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            
            res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            console.log(error);
            res.status(500).send('Lỗi xuất file Excel');
        }
    }

    // [POST] /admin/products/import
    async importExcel(req, res) {
        try {
            if (!req.file) {
                return res.status(400).send('<script>alert("Vui lòng chọn file Excel"); window.location.href="/admin/products";</script>');
            }

            const workbook = xlsx.read(req.file.path, { type: 'file' });
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            let successCount = 0;
            let skipCount = 0;

            for (const item of data) {
                if (!item.Name) continue;
                
                const existing = await Product.findOne({ name: item.Name });
                if (existing) {
                    skipCount++;
                    continue;
                }
                
                const newProduct = new Product({
                    name: item.Name,
                    price: item.Price || 0,
                    discount_price: item.DiscountPrice || null,
                    stock_quantity: item.Stock || 0,
                    status: item.Status === 'Ngừng bán' ? 0 : 1,
                });
                
                await newProduct.save();
                successCount++;
            }

            fs.unlinkSync(req.file.path);

            res.send(`<script>alert("Nhập file thành công! Thêm mới: ${successCount}, Bỏ qua trùng lặp: ${skipCount}"); window.location.href="/admin/products";</script>`);
        } catch (error) {
            console.log(error);
            res.status(500).send('<script>alert("Lỗi nhập file Excel"); window.location.href="/admin/products";</script>');
        }
    }
}

module.exports = new ProductController();