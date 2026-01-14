// models/kdsModel.js
const db = require('../db/database');

module.exports = class KdsModel {
    
    // Login Sorgusu
    static login(username, password) {
        return db.execute('SELECT * FROM yonetici WHERE kullanici_adi = ? AND sifre = ?', [username, password]);
    }

    // Tüm İlçeleri Getir
    static fetchAllIlceler() {
        return db.execute('SELECT * FROM ilceler');
    }

    // API 1: Tüketim Trendi
    static getTuketimTrend(baslangic, bitis) {
        const sql = `SELECT DATE_FORMAT(tarih, '%Y-%m') as ay, SUM(miktar_kwh) as toplam_miktar FROM tuketim WHERE DATE_FORMAT(tarih, '%Y-%m') >= ? AND DATE_FORMAT(tarih, '%Y-%m') <= ? GROUP BY DATE_FORMAT(tarih, '%Y-%m') ORDER BY ay ASC`;
        return db.execute(sql, [baslangic, bitis]);
    }

    // API 2: Bölgesel Tüketim
    static getBolgeselTuketim(ilceId, baslangic, bitis) {
        const sql = `SELECT DATE_FORMAT(tarih, '%Y-%m') as ay, miktar_kwh FROM tuketim WHERE ilce_id = ? AND DATE_FORMAT(tarih, '%Y-%m') >= ? AND DATE_FORMAT(tarih, '%Y-%m') <= ? ORDER BY tarih ASC`;
        return db.execute(sql, [ilceId, baslangic, bitis]);
    }

    // API 3: Bölgesel Arıza
    static getBolgeselAriza(ilceId, baslangic, bitis) {
        const sql = `SELECT DATE_FORMAT(tarih, '%Y-%m') as ay, COUNT(*) as ariza_sayisi FROM kesintiler WHERE ilce_id = ? AND DATE_FORMAT(tarih, '%Y-%m') >= ? AND DATE_FORMAT(tarih, '%Y-%m') <= ? GROUP BY DATE_FORMAT(tarih, '%Y-%m') ORDER BY ay ASC`;
        return db.execute(sql, [ilceId, baslangic, bitis]);
    }

    // API 4: Kesinti Nedenleri
    static getKesintiNedenleri(ilceId) {
        return db.execute(`SELECT neden, COUNT(*) as sayi FROM kesintiler WHERE ilce_id = ? GROUP BY neden`, [ilceId]);
    }

    // API 5: Tahmin İçin Geçmiş Veri
    static getGecmisVeriTahmin(ilceId) {
        return db.execute(`SELECT MONTH(tarih) as ay, AVG(miktar_kwh) as ortalama FROM tuketim WHERE ilce_id = ? AND YEAR(tarih) IN (2024, 2025) GROUP BY MONTH(tarih) ORDER BY ay ASC`, [ilceId]);
    }

    // API 6: KPI Metrikleri 
    static getToplamTuketimByDate(tarih) {
        return db.execute(`SELECT SUM(miktar_kwh) as toplam FROM tuketim WHERE DATE_FORMAT(tarih, '%Y-%m') = ?`, [tarih]);
    }
    static getMaxIlceByDate(tarih) {
        return db.execute(`SELECT i.ad as ilce_adi, SUM(t.miktar_kwh) as toplam FROM tuketim t JOIN ilceler i ON t.ilce_id = i.id WHERE DATE_FORMAT(t.tarih, '%Y-%m') = ? GROUP BY t.ilce_id, i.ad ORDER BY toplam DESC LIMIT 1`, [tarih]);
    }
    static getArizaCountByDate(tarih) {
        return db.execute(`SELECT COUNT(*) as sayi FROM kesintiler WHERE DATE_FORMAT(tarih, '%Y-%m') = ?`, [tarih]);
    }

    // API 7: İlçe Tipi Dağılımı
    static getTuketimTipDagilim(tarih) {
        return db.execute(`SELECT i.tip, SUM(t.miktar_kwh) as toplam FROM tuketim t JOIN ilceler i ON t.ilce_id = i.id WHERE DATE_FORMAT(t.tarih, '%Y-%m') = ? GROUP BY i.tip ORDER BY toplam DESC`, [tarih]);
    }

    // API 8 & 9: Top 8 Listeleri
    static getTop8Tuketim(baslangic, bitis) {
        return db.execute(`SELECT i.ad as ilce_adi, SUM(t.miktar_kwh) as toplam FROM tuketim t JOIN ilceler i ON t.ilce_id = i.id WHERE DATE_FORMAT(t.tarih, '%Y-%m') >= ? AND DATE_FORMAT(t.tarih, '%Y-%m') <= ? GROUP BY t.ilce_id, i.ad ORDER BY toplam DESC LIMIT 8`, [baslangic, bitis]);
    }
    static getTop8Ariza(baslangic, bitis) {
        return db.execute(`SELECT i.ad as ilce_adi, COUNT(k.id) as sayi FROM kesintiler k JOIN ilceler i ON k.ilce_id = i.id WHERE DATE_FORMAT(k.tarih, '%Y-%m') >= ? AND DATE_FORMAT(k.tarih, '%Y-%m') <= ? GROUP BY k.ilce_id, i.ad ORDER BY sayi DESC LIMIT 8`, [baslangic, bitis]);
    }

    // API 10: Bölge Karşılaştırma (Veri Çekme)
    static getBolgeVerileri(ilceId, baslangic, bitis) {
        const sqlTuketim = `SELECT i.ad as ilce_adi, SUM(t.miktar_kwh) as toplam FROM tuketim t JOIN ilceler i ON t.ilce_id = i.id WHERE ilce_id = ? AND DATE_FORMAT(tarih, '%Y-%m') >= ? AND DATE_FORMAT(tarih, '%Y-%m') <= ?`;
        const sqlAriza = `SELECT COUNT(*) as sayi FROM kesintiler WHERE ilce_id = ? AND DATE_FORMAT(tarih, '%Y-%m') >= ? AND DATE_FORMAT(tarih, '%Y-%m') <= ?`;
        
        // Promise.all ile ikisini aynı anda döndürüyoruz
        return Promise.all([
            db.execute(sqlTuketim, [ilceId, baslangic, bitis]),
            db.execute(sqlAriza, [ilceId, baslangic, bitis])
        ]);
    }
};// Yeni Arıza Kaydı Ekleme (CREATE)
exports.addAriza = (ilce_id, neden,  tarih) => {
    return db.execute(
        'INSERT INTO kesintiler (ilce_id, neden,  tarih) VALUES (?, ?, ?)',
        [ilce_id, neden,  tarih]
    );
};

// Arıza Kaydı Silme (DELETE)
exports.deleteAriza = (id) => {
    return db.execute('DELETE FROM kesintiler WHERE id = ?', [id]);
};