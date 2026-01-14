// controllers/kdsController.js
const KdsModel = require('../models/kdsModel');

// --- SAYFA YÖNETİMİ ---

exports.getLogin = (req, res) => {
    res.render('login', { pageTitle: 'Yönetici Girişi', error: undefined });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await KdsModel.login(username, password);
        if (rows.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/');
        } else {
            res.render('login', { pageTitle: 'Yönetici Girişi', error: 'Hatalı kullanıcı adı veya şifre!' });
        }
    } catch (err) {
        console.log(err);
        res.send("Veritabanı hatası!");
    }
};

exports.getLogout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};

exports.getIndex = (req, res) => {
    KdsModel.fetchAllIlceler()
        .then(([rows]) => {
            res.render('index', {
                pageTitle: 'GDZ KDS Paneli',
                ilceler: rows,
                user: req.session.username
            });
        })
        .catch(err => console.log(err));
};

// --- API İŞLEMLERİ ---

exports.getTuketimTrend = (req, res) => {
    const { baslangic, bitis } = req.query;
    KdsModel.getTuketimTrend(baslangic, bitis)
        .then(([rows]) => res.json(rows))
        .catch(err => res.status(500).json({ error: 'DB Hatası' }));
};

exports.getBolgeselTuketim = (req, res) => {
    const { ilceId, baslangic, bitis } = req.query;
    KdsModel.getBolgeselTuketim(ilceId, baslangic, bitis)
        .then(([rows]) => res.json(rows))
        .catch(err => res.status(500).json({ error: 'DB Hatası' }));
};

exports.getBolgeselAriza = (req, res) => {
    const { ilceId, baslangic, bitis } = req.query;
    KdsModel.getBolgeselAriza(ilceId, baslangic, bitis)
        .then(([rows]) => res.json(rows))
        .catch(err => res.status(500).json({ error: 'DB Hatası' }));
};

exports.getKesintiNedenleri = (req, res) => {
    const { ilceId } = req.query;
    KdsModel.getKesintiNedenleri(ilceId)
        .then(([rows]) => res.json(rows))
        .catch(err => res.status(500).json({ error: 'DB Hatası' }));
};

exports.getTuketimTahmin = (req, res) => {
    const { ilceId, ceyrek } = req.query;
    KdsModel.getGecmisVeriTahmin(ilceId).then(([rows]) => {
        const aylarIsimleri = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        let ortalamaData = new Array(12).fill(0);
        let tahminData = new Array(12).fill(0);
        const senaryoArtisOrani = 1.05 + (Math.random() * 0.30); 

        rows.forEach(row => {
            let index = row.ay - 1;
            let avg = Math.round(row.ortalama);
            ortalamaData[index] = avg;
            tahminData[index] = Math.round((avg * senaryoArtisOrani) + (Math.random() * 100));
        });

        // Çeyrek Filtreleme
        let startMonth = 0, endMonth = 11;
        if (ceyrek == '1') { startMonth = 0; endMonth = 2; }
        else if (ceyrek == '2') { startMonth = 3; endMonth = 5; }
        else if (ceyrek == '3') { startMonth = 6; endMonth = 8; }
        else if (ceyrek == '4') { startMonth = 9; endMonth = 11; }

        let finalLabels = [], finalOrtalama = [], finalTahmin = [];
        for (let i = startMonth; i <= endMonth; i++) {
            finalLabels.push(aylarIsimleri[i]);
            finalOrtalama.push(ortalamaData[i]);
            finalTahmin.push(tahminData[i]);
        }
        res.json({ labels: finalLabels, ortalama: finalOrtalama, tahmin: finalTahmin });
    }).catch(err => res.status(500).json({ error: 'DB Hatası' }));
};

exports.getKpiMetrics = async (req, res) => {
    const { tarih } = req.query;
    if (!tarih) return res.status(400).json({ error: 'Tarih seçilmedi' });
    try {
        const [currRows] = await KdsModel.getToplamTuketimByDate(tarih);
        const currentConsumption = currRows[0].toplam || 0;

        const parts = tarih.split('-');
        let prevYil = parseInt(parts[0]), prevAy = parseInt(parts[1]) - 1;
        if (prevAy === 0) { prevAy = 12; prevYil -= 1; }
        const prevTarih = `${prevYil}-${String(prevAy).padStart(2, '0')}`;
        
        const [prevRows] = await KdsModel.getToplamTuketimByDate(prevTarih);
        const prevConsumption = prevRows[0].toplam || 0;

        let degisimYuzdesi = 0;
        if (prevConsumption > 0) degisimYuzdesi = ((currentConsumption - prevConsumption) / prevConsumption) * 100;
        else if (currentConsumption > 0) degisimYuzdesi = 100;

        const [maxIlceRows] = await KdsModel.getMaxIlceByDate(tarih);
        const championIlce = maxIlceRows.length > 0 ? maxIlceRows[0].ilce_adi : '-';

        const [arizaRows] = await KdsModel.getArizaCountByDate(tarih);
        res.json({ tuketim: currentConsumption, degisim: degisimYuzdesi.toFixed(1), sampiyon: championIlce, kesinti: arizaRows[0].sayi || 0 });
    } catch (err) { res.status(500).json({ error: 'DB Hatası' }); }
};

exports.getTuketimTipDagilim = async (req, res) => {
    const { tarih } = req.query;
    try {
        const [rows] = await KdsModel.getTuketimTipDagilim(tarih);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Veritabanı hatası' }); }
};

exports.getTop8Tuketim = async (req, res) => {
    const { baslangic, bitis } = req.query;
    try { const [rows] = await KdsModel.getTop8Tuketim(baslangic, bitis); res.json(rows); } 
    catch (err) { res.status(500).json({ error: 'Hata' }); }
};

exports.getTop8Ariza = async (req, res) => {
    const { baslangic, bitis } = req.query;
    try { const [rows] = await KdsModel.getTop8Ariza(baslangic, bitis); res.json(rows); } 
    catch (err) { res.status(500).json({ error: 'Hata' }); }
};

exports.getBolgeKarsilastirma = async (req, res) => {
    const { ilce1, ilce2, baslangic, bitis } = req.query;
    if (!ilce1 || !ilce2) return res.status(400).json({ error: 'İki ilçe seçiniz.' });

    try {
        // Modelden verileri çek
        const [sonuc1, sonuc2] = await Promise.all([
            KdsModel.getBolgeVerileri(ilce1, baslangic, bitis),
            KdsModel.getBolgeVerileri(ilce2, baslangic, bitis)
        ]);

        // Verileri Ayrıştır (Tüketim ve Arıza olarak)
        const rowT1 = sonuc1[0][0], rowA1 = sonuc1[1][0];
        const rowT2 = sonuc2[0][0], rowA2 = sonuc2[1][0];

        const ad1 = (rowT1 && rowT1[0]) ? rowT1[0].ilce_adi : "1. Bölge";
        const tuketim1 = parseFloat((rowT1 && rowT1[0]) ? rowT1[0].toplam : 0);
        const ariza1 = (rowA1 && rowA1[0]) ? rowA1[0].sayi : 0;

        const ad2 = (rowT2 && rowT2[0]) ? rowT2[0].ilce_adi : "2. Bölge";
        const tuketim2 = parseFloat((rowT2 && rowT2[0]) ? rowT2[0].toplam : 0);
        const ariza2 = (rowA2 && rowA2[0]) ? rowA2[0].sayi : 0;

        // KDS MANTIĞI (Business Logic)
        let analizBasligi = "Durum Stabil";
        let analizMesaji = "Olağan dışı bir durum yok.";
        let yatirimOnerisi = "Rutin bakım prosedürlerine devam.";
        let riskDurumu = "dusuk";

        if (tuketim1 < tuketim2 && ariza1 > ariza2) {
            analizBasligi = `${ad1} Bölgesi KRİTİK Durumda!`;
            analizMesaji = `${ad1}, ${ad2} bölgesine göre daha az elektrik tüketmesine rağmen arıza sayısı çok daha yüksek (${ariza1} vs ${ariza2}).`;
            yatirimOnerisi = `Yatırım bütçesi ${ad1} trafo merkezlerine ayrılmalı.`;
            riskDurumu = "yuksek";
        } else if (tuketim2 < tuketim1 && ariza2 > ariza1) {
            analizBasligi = `${ad2} Bölgesi KRİTİK Durumda!`;
            analizMesaji = `${ad2}, ${ad1} bölgesine göre daha az tüketime sahip ama arıza sıklığı daha fazla.`;
            yatirimOnerisi = `Yatırım bütçesi ${ad2} trafo merkezlerine ayrılmalı.`;
            riskDurumu = "yuksek";
        } else if (tuketim1 > (tuketim2 * 1.5)) {
             analizBasligi = `${ad1} Kapasite Zorlanması`;
             analizMesaji = `${ad1} tüketimi aşırı yüksek.`;
             yatirimOnerisi = "Kapasite artırımı planlanmalı.";
             riskDurumu = "orta";
        } else if (tuketim2 > (tuketim1 * 1.5)) {
             analizBasligi = `${ad2} Kapasite Zorlanması`;
             analizMesaji = `${ad2} tüketimi aşırı yüksek.`;
             yatirimOnerisi = "Kapasite artırımı planlanmalı.";
             riskDurumu = "orta";
        }

        res.json({
            veri: { bolge1: { ad: ad1, tuketim: tuketim1, ariza: ariza1 }, bolge2: { ad: ad2, tuketim: tuketim2, ariza: ariza2 } },
            kds_karari: { baslik: analizBasligi, mesaj: analizMesaji, oneri: yatirimOnerisi, risk_level: riskDurumu }
        });
    } catch (err) { console.log(err); res.status(500).json({ error: 'Hata' }); }
};// --- CRUD VE İŞ KURALLARI (BUSINESS LOGIC) ---

exports.postArizaEkle = async (req, res) => {
    const { ilce_id, neden,  tarih } = req.body;

    // ---  Gelecek Tarih Kontrolü ---
    const girilenTarih = new Date(tarih);
    const bugun = new Date();
    if (girilenTarih > bugun) {
        return res.status(400).json({ 
            hata: "İŞ KURALI HATASI: Gelecek tarihli arıza kaydı girilemez!" 
        });
    }

    // ---  Negatif Değer Kontrolü ---
    if (sure <= 0) {
        return res.status(400).json({ 
            hata: "İŞ KURALI HATASI: Kesinti süresi 0 veya negatif olamaz!" 
        });
    }

    try {
        
        await KdsModel.addAriza(ilce_id, neden, sure, tarih);
        res.status(201).json({ mesaj: "Arıza kaydı başarıyla, iş kurallarına uygun şekilde eklendi." });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ hata: "Veritabanına kayıt eklenirken hata oluştu." });
    }
};

exports.ArizaSil = async (req, res) => {
    const { id } = req.params;

    try {
        await KdsModel.deleteAriza(id);
        res.status(200).json({ mesaj: "Kayıt silindi." });
    } catch (err) {
        console.log(err);
        res.status(500).json({ hata: "Silme işlemi başarısız." });
    }
};