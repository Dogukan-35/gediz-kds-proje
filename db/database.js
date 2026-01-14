
const mysql = require('mysql2/promise'); 
require('dotenv').config(); 


const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Bağlantı testi
db.getConnection()
    .then(connection => {
        console.log('✅ Veritabanına başarıyla bağlanıldı!');
        connection.release(); 
    })
    .catch(error => {
        console.error('❌ Veritabanı bağlantı hatası:', error.message);
    });

module.exports = db;