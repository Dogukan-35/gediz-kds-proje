// routes/kdsRoutes.js
const express = require('express');
const router = express.Router();
const kdsController = require('../controllers/kdsController');

// Middleware (Güvenlik)
const authKontrol = (req, res, next) => {
    if (req.session.loggedin) next();
    else res.redirect('/login');
};

// Sayfa Rotaları
router.get('/', authKontrol, kdsController.getIndex);
router.get('/login', kdsController.getLogin);
router.post('/login', kdsController.postLogin);
router.get('/logout', kdsController.getLogout);

// API Rotaları
router.get('/api/tuketim-trend', authKontrol, kdsController.getTuketimTrend);
router.get('/api/tuketim-bolgesel', authKontrol, kdsController.getBolgeselTuketim);
router.get('/api/ariza-bolgesel', authKontrol, kdsController.getBolgeselAriza);
router.get('/api/kesinti-nedenleri', authKontrol, kdsController.getKesintiNedenleri);
router.get('/api/tuketim-tahmin', authKontrol, kdsController.getTuketimTahmin);
router.get('/api/kpi-metrics', authKontrol, kdsController.getKpiMetrics);
router.get('/api/tuketim-tip-dagilim', authKontrol, kdsController.getTuketimTipDagilim);
router.get('/api/top8-tuketim', authKontrol, kdsController.getTop8Tuketim);
router.get('/api/top8-ariza', authKontrol, kdsController.getTop8Ariza);
router.get('/api/bolge-karsilastirma', authKontrol, kdsController.getBolgeKarsilastirma);
router.post('/api/ariza/ekle', kdsController.postArizaEkle);
router.delete('/api/ariza/:id', kdsController.ArizaSil);
module.exports = router;