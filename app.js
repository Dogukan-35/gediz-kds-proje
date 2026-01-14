// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');

// Ayarlar
dotenv.config();
const app = express();

// Rotaları İçe Aktar
const kdsRoutes = require('./routers/kdsRoutes');

// View Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'gdz_gizli_anahtar_key_123',
    resave: false,
    saveUninitialized: true
}));

// Rotaları Kullan 
app.use(kdsRoutes);

// 404
app.use((req, res, next) => res.status(404).send('<h1>404 - Sayfa Bulunamadı</h1>'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));