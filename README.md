# ⚡ Gediz Elektrik - Altyapı Yatırımları Karar Destek Sistemi (KDS)

Bu proje, **Sunucu Tabanlı Programlama** dersi kapsamında,  İzmir'in 30 ilçesinin  2024-2025 yıllarında aylara göre elektrik tüketim ve arıza  verilerini analiz ederek  altyapı ve yatırım planlamalarına veri odaklı karar desteği sağlamak amacıyla geliştirilmiştir.

## 🎯 Projenin Amacı ve Senaryo
Gediz Elektrik dağıtım bölgesindeki ilçelerin;
1.  **Tüketim Verilerini** analiz ederek artış trendlerini belirlemek,
2.  **Arıza Kayıtlarını** inceleyerek altyapı yetersizliği olan bölgeleri tespit etmek,
3.  Yöneticilere **"Yatırım Yapılmalı"** veya **"Stabil"** şeklinde akıllı öneriler sunmaktır.

**Bu dersin kapsamında eklediğim 2 CRUD için Uygulanan İş Kuralları (Business Rules):**
* **Kural 1:** Gelecek tarihli bir arıza kaydı sisteme girilemez (Backend validasyonu).
* **Kural 2:** Var olmayan bir arıza kaydı silinemez.

## 🛠️ Kullanılan Teknolojiler
* **Backend:** Node.js, Express.js (MVC Mimarisi)
* **Veritabanı:** MySQL
* **Frontend:** EJS, CSS3, JavaScript
* **Kütüphaneler:** Chart.js (Grafikler), Leaflet.js (Harita)

## ⚙️ Kurulum Adımları
Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla uygulayınız:

1.  **Projeyi İndirin:**
    Projeyi bilgisayarınıza klonlayın
   

2.  **Gerekli Paketleri Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    * Ana dizindeki `.env.example` dosyasının adını `.env` olarak değiştirin.
    * Dosyayı açıp kendi veritabanı bilgilerinizi (kullanıcı adı, şifre vb.) girin.

4.  **Veritabanını ve Admin Hesabını Yükleyin (ÖNEMLİ):**
    * MySQL veritabanı yönetim panelinizi (phpMyAdmin / Workbench) açın.
    * `gediz_kds_v2` adında boş bir veritabanı oluşturun.
    * Projenin ana dizininde bulunan **`gediz_kds_v2.sql`** dosyasını bu veritabanına **Import (İçe Aktar)** edin.
    * *Bu işlem, gerekli tabloları ve hazır Yönetici (Admin) hesabını oluşturacaktır.*

5.  **Sunucuyu Başlatın:**
    ```bash
    node app.js
    ```

6.  **Giriş Yapın:**
    * Tarayıcıda `http://localhost:3000` adresine gidin.
    * Aşağıdaki bilgilerle sisteme giriş yapın:
        * **Kullanıcı Adı:** admin
        * **Şifre:** gdz.2025

## 🔌 API Endpoint Listesi (RESTful)

| Metot | URL | Açıklama |
// Sayfa Rotaları
router.get('/', authKontrol, kdsController.getIndex);**authKontrol (Middleware) sayesinde önce giriş yapılıp yapılmadığına bakar.** 
// Eğer giriş yapılmışsa kdsController.getIndex çalışır ve paneli açar.
router.get('/login', kdsController.getLogin); **Kullanıcıya "Giriş Yap" formunun olduğu sayfayı (login.ejs) gösterir.**
router.post('/login', kdsController.postLogin);**Şifreyi kontrol eder, doğruysa oturumu başlatır.**
router.get('/logout', kdsController.getLogout); **Kullanıcının oturumunu (session) sonlandırır ve tekrar giriş sayfasına yönlendirir.**

// API Rotaları
router.get('/api/tuketim-trend', authKontrol, kdsController.getTuketimTrend);**Tüm ilçelerin 24 aylık veriler üzerinden elektrik tüketim trendi**
router.get('/api/tuketim-bolgesel', authKontrol, kdsController.getBolgeselTuketim);**Harita üzerinden seçilen iki ilçenin tüketim verileri karşılaştırılması**
router.get('/api/ariza-bolgesel', authKontrol, kdsController.getBolgeselAriza);**Harita üzerinden seçilen iki ilçenin arıza sayıları karşılaştırılması**
router.get('/api/kesinti-nedenleri', authKontrol, kdsController.getKesintiNedenleri);**İlçelere göre kesinti nedenleri analizi**
router.get('/api/tuketim-tahmin', authKontrol, kdsController.getTuketimTahmin);**Geçmiş tüketim verilerinden gelecek tüketim tahminlemesi**
router.get('/api/kpi-metrics', authKontrol, kdsController.getKpiMetrics);
router.get('/api/tuketim-tip-dagilim', authKontrol, kdsController.getTuketimTipDagilim);**Anasayfadaki kpi kartları**
router.get('/api/top8-tuketim', authKontrol, kdsController.getTop8Tuketim); **En çok elektrik tüketimi yapan 8 ilçenin gösterilmesi (zamana göre filtresiyle)**
router.get('/api/top8-ariza', authKontrol, kdsController.getTop8Ariza);
router.get('/api/bolge-karsilastirma', authKontrol, kdsController.getBolgeKarsilastirma); **En çok arıza saysı olan 8 ilçenin gösterilmesi(zamana göre filtresiyle)**
router.post('/api/ariza/ekle', kdsController.postArizaEkle);  **Bu ve altında eklediğim API bu ders kapsamında ekledim frontend bağlantısı eklemedim sadece backend tarafında yaptım**
router.delete('/api/ariza/:id', kdsController.ArizaSil);

## 📂 Proje Klasör Yapısı (MVC)
* `routers/` - URL yönlendirmeleri
* `controllers/` - İş mantığı ve kurallar
* `models/` - Veritabanı sorguları
* `views/` - Kullanıcı arayüzü (EJS)
* `public/` - CSS, JS ve Resim dosyaları