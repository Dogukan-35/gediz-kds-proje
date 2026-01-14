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

Projede kullanılan yönlendirmeler ve API servisleri aşağıda listelenmiştir:

### 📄 Sayfa Yönlendirmeleri (Views)
| Metot | URL | Açıklama |
| :--- | :--- | :--- |
| **GET** | `/` | Yönetici Paneli (Dashboard) - *Auth (Giriş) kontrolü yapar* |
| **GET** | `/login` | Giriş Yap sayfasını gösterir |
| **POST** | `/login` | Giriş işlemini yapar (Şifre kontrolü ve Oturum açma) |
| **GET** | `/logout` | Oturumu sonlandırır ve çıkış yapar |

### 📊 Veri Servisleri (Analiz & Raporlama)
| Metot | URL | Açıklama |
| :--- | :--- | :--- |
| **GET** | `/api/tuketim-trend` | Tüm ilçelerin 24 aylık elektrik tüketim trendi |
| **GET** | `/api/tuketim-bolgesel` | Harita üzerinde seçilen iki ilçenin tüketim karşılaştırması |
| **GET** | `/api/ariza-bolgesel` | Harita üzerinde seçilen iki ilçenin arıza sayıları |
| **GET** | `/api/kesinti-nedenleri` | İlçelere göre kesinti nedenlerinin analizi |
| **GET** | `/api/tuketim-tahmin` | Geçmiş verilerden gelecek tüketim tahmini (Regresyon) |
| **GET** | `/api/kpi-metrics` | Anasayfa üstündeki özet bilgi kartları (KPI) |
| **GET** | `/api/tuketim-tip-dagilim` | Tüketimin abone tiplerine dağılımı (Mesken, Sanayi vb.) |
| **GET** | `/api/top8-tuketim` | En çok tüketim yapan 8 ilçenin listesi (Zaman filtreli) |
| **GET** | `/api/top8-ariza` | En çok arıza sayısı olan 8 ilçenin listesi (Zaman filtreli) |
| **GET** | `/api/bolge-karsilastirma` | İki bölge arasında detaylı Karar Destek karşılaştırması |

### 🛠️ İşlem Servisleri (CRUD - Backend)
*Bu endpoint'ler, ders kapsamındaki "CRUD ve İş Kuralı" isteklerini karşılamak için Backend tarafında geliştirilmiştir Frontend bağlantısı bulunmamaktadır.*

| Metot | URL | Açıklama |
| :--- | :--- | :--- |
| **POST** | `/api/ariza/ekle` | Yeni arıza kaydı oluşturur  |
| **DELETE** | `/api/ariza/:id` | ID'si verilen arıza kaydını siler |

## 📂 Proje Klasör Yapısı (MVC)
* `routers/` - URL yönlendirmeleri
* `controllers/` - İş mantığı ve kurallar
* `models/` - Veritabanı sorguları
* `views/` - Kullanıcı arayüzü (EJS)
* `public/` - CSS, JS ve Resim dosyaları