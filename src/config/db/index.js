const mongoose = require('mongoose');

const Brand = require('../../app/models/Brand');

async function connect() {
     
    var uri = 'mongodb://admin:admin123@ac-ojrzlva-shard-00-01.zcn6uzv.mongodb.net:27017/ban_hang_db?ssl=true&authSource=admin'; 
    await mongoose.connect(uri) 
        .then(async () => {
            console.log('Đã kết nối thành công tới MongoDB.');
            
            // --- THÊM ĐOẠN CODE TEST NÀY ---
            try {
                // Thêm thử 1 Brand mới tên là Orion giống trong file SQL cũ
                // const newBrand = new Brand({ name: 'Orion' });
                // await newBrand.save();
                console.log('Đã thêm dữ liệu Test thành công. Hãy lên Atlas kiểm tra!');
            } catch (error) {
                console.log('Lỗi khi thêm dữ liệu:', error);
            }
            // ---------------------------------
        }) 
        .catch(err => console.log(err));
    }

module.exports = { connect };