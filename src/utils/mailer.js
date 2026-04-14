const nodemailer = require('nodemailer');

// Cấu hình transporter — Dùng Gmail App Password
// Hướng dẫn: Vào Google Account > Security > 2-Step Verification > App passwords > Tạo mật khẩu ứng dụng
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'voty365@gmail.com', // Email gửi
        pass: process.env.EMAIL_PASS || 'hhzp tstw gxkc jrdl'          // App Password (16 ký tự)
    }
});

/**
 * Gửi email thông báo trạng thái đơn hàng
 */
async function sendOrderStatusEmail(toEmail, fullname, orderId, statusText) {
    try {
        const shortId = orderId.toString().slice(-6).toUpperCase();
        const mailOptions = {
            from: '"Bách Hóa Pew" <bachhoaonline.pew@gmail.com>',
            to: toEmail,
            subject: `[Bách Hóa Pew] Đơn hàng #${shortId} - ${statusText}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1a6b3c, #2e8b57); padding: 25px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">Bách Hóa Pew</h1>
                        <p style="color: #d4edda; margin: 5px 0 0;">Thông báo đơn hàng</p>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">Xin chào <strong>${fullname}</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6;">
                            Đơn hàng <strong>#${shortId}</strong> của bạn đã được cập nhật trạng thái:
                        </p>
                        <div style="background: #f8f9fa; border-left: 4px solid #2e8b57; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2e8b57;">
                                📦 ${statusText}
                            </p>
                        </div>
                        <p style="font-size: 14px; color: #666;">
                            Bạn có thể theo dõi đơn hàng tại mục <strong>"Đơn hàng của tôi"</strong> trên website.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            © 2026 Bách Hóa Pew. Email tự động, vui lòng không trả lời.
                        </p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email đã gửi đến ${toEmail} cho đơn #${shortId}`);
    } catch (error) {
        console.error('❌ Lỗi gửi email đơn hàng:', error.message);
    }
}

/**
 * Gửi email thông báo sản phẩm có hàng trở lại
 */
async function sendBackInStockEmail(toEmail, fullname, productName, productId) {
    try {
        const mailOptions = {
            from: '"Bách Hóa Pew" <bachhoaonline.pew@gmail.com>',
            to: toEmail,
            subject: `[Bách Hóa Pew] 🎉 ${productName} đã có hàng trở lại!`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 25px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">🔔 Có hàng trở lại!</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">Xin chào <strong>${fullname}</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6;">
                            Sản phẩm <strong>"${productName}"</strong> mà bạn đã đăng ký theo dõi giờ đã có hàng trở lại! 🎉
                        </p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/product/${productId}" 
                               style="display: inline-block; background: #2e8b57; color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Mua ngay →
                            </a>
                        </div>
                        <p style="font-size: 13px; color: #999;">Nhanh tay trước khi hết hàng lần nữa nhé!</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            © 2026 Bách Hóa Pew. Email tự động, vui lòng không trả lời.
                        </p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email có hàng trở lại đã gửi đến ${toEmail} cho SP: ${productName}`);
    } catch (error) {
        console.error('❌ Lỗi gửi email có hàng trở lại:', error.message);
    }
}

/**
 * Gửi email chào mừng khi đăng ký
 */
async function sendWelcomeEmail(toEmail, fullname) {
    try {
        const mailOptions = {
            from: '"Bách Hóa Pew" <bachhoaonline.pew@gmail.com>',
            to: toEmail,
            subject: `[Bách Hóa Pew] Đăng ký thành công! Chào mừng ${fullname}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1a6b3c, #2e8b57); padding: 25px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">Bách Hóa Pew</h1>
                        <p style="color: #d4edda; margin: 5px 0 0;">Đăng ký tài khoản thành công</p>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">Xin chào <strong>${fullname}</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6;">
                            Chúc mừng bạn đã trở thành thành viên của gia đình <strong>Bách Hóa Pew</strong>! Chúng tôi rất vui mừng khi có bạn đồng hành.
                        </p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${process.env.BASE_URL || 'http://localhost:3000'}" 
                               style="display: inline-block; background: #2e8b57; color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Mua sắm ngay →
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666;">
                            Bạn có thể truy cập <strong>"Tài khoản của tôi"</strong> để cập nhật thông tin và theo dõi đơn hàng của mình.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            © 2026 Bách Hóa Pew. Email tự động, vui lòng không trả lời.
                        </p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email chào mừng đã gửi đến ${toEmail}`);
    } catch (error) {
        console.error('❌ Lỗi gửi email chào mừng:', error.message);
    }
}

module.exports = { sendOrderStatusEmail, sendBackInStockEmail, sendWelcomeEmail };
