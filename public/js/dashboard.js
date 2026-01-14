let charts = {}; 
let trendChart = null, pieChart = null, tahminChart = null, tipChart = null;
let top8TuketimChart = null, top8ArizaChart = null; 
let map = null;
let selectedDistricts = []; 

// İzmir İlçe Koordinatları
const ilceKoordinatlari = {
    'Aliağa': [38.7993, 26.9728], 'Balçova': [38.3936, 27.0435], 'Bayındır': [38.2136, 27.6472], 'Bayraklı': [38.4633, 27.1656],
    'Bergama': [39.1207, 27.1806], 'Beydağ': [38.0844, 28.2069], 'Bornova': [38.4674, 27.2214], 'Buca': [38.3861, 27.1756],
    'Çeşme': [38.3242, 26.3025], 'Çiğli': [38.4842, 27.0850], 'Dikili': [39.0722, 26.8889], 'Foça': [38.6692, 26.7533],
    'Gaziemir': [38.3256, 27.1350], 'Güzelbahçe': [38.3692, 26.8925], 'Karabağlar': [38.3758, 27.0983], 'Karaburun': [38.6367, 26.5161],
    'Karşıyaka': [38.4550, 27.1189], 'Kemalpaşa': [38.4258, 27.4172], 'Kınık': [39.0883, 27.3828], 'Kiraz': [38.2325, 28.2061],
    'Konak': [38.4189, 27.1287], 'Menderes': [38.2497, 27.1344], 'Menemen': [38.6019, 27.0758], 'Narlıdere': [38.3975, 27.0050],
    'Ödemiş': [38.2278, 27.9722], 'Seferihisar': [38.1986, 26.8394], 'Selçuk': [37.9483, 27.3681], 'Tire': [38.0892, 27.7328],
    'Torbalı': [38.1517, 27.3619], 'Urla': [38.3228, 26.7650]
};

// dbIlceler değişkeni index.ejs'ten global olarak gelecek

function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

// --- HARİTA YÖNETİMİ ---
function initMapOnce() {
    if (map !== null) return; 

    // İzmir Merkez
    map = L.map('map').setView([38.42, 27.14], 9); 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors & CartoDB'
    }).addTo(map);

    // dbIlceler değişkenini EJS'den okuyoruz
    if(typeof dbIlceler !== 'undefined') {
        dbIlceler.forEach(ilce => {
            if (ilceKoordinatlari[ilce.ad]) {
                const coord = ilceKoordinatlari[ilce.ad];
                const marker = L.circleMarker(coord, { color: '#3498db', fillColor: '#3498db', fillOpacity: 0.5, radius: 12 }).addTo(map);
                marker.on('click', () => { toggleDistrictSelection(ilce, marker); });
                marker.bindTooltip(ilce.ad, {permanent: false, direction: 'top'});
                ilce.marker = marker;
            }
        });
    }
}

function toggleDistrictSelection(ilce, marker) {
    const index = selectedDistricts.findIndex(d => d.id === ilce.id);
    if (index > -1) {
        selectedDistricts.splice(index, 1);
        marker.setStyle({ color: '#3498db', fillColor: '#3498db' }); 
    } else {
        if (selectedDistricts.length >= 2) {
            alert("Haritadan en fazla 2 ilçe seçip kıyaslayabilirsiniz.");
            return;
        }
        selectedDistricts.push(ilce);
        marker.setStyle({ color: '#e74c3c', fillColor: '#e74c3c' }); 
    }
    updateSelectedCharts();
}

function updateSelectedCharts() {
    const chartsArea = document.getElementById('chartsArea');
    const emptyState = document.getElementById('emptyState');
    const kdsPanel = document.getElementById('kdsKarsilastirmaPanel');
    const start = document.getElementById('mapStart').value;
    const end = document.getElementById('mapEnd').value;

    if (selectedDistricts.length === 0) {
        chartsArea.style.display = 'none';
        emptyState.style.display = 'block';
        kdsPanel.style.display = 'none';
        return;
    }

    chartsArea.style.display = 'block';
    emptyState.style.display = 'none';

    // ---  KARŞILAŞTIRMA ÇAĞRISI (Eğer 2 ilçe seçiliyse) ---
    if (selectedDistricts.length === 2) {
        fetchKDSComparison(selectedDistricts[0].id, selectedDistricts[1].id, start, end);
    } else {
        kdsPanel.style.display = 'none';
    }
    // --------------------------------------------------------

    for (let i = 0; i < 2; i++) {
        const ilce = selectedDistricts[i];
        const colTuketim = document.getElementById(`colTuketim${i+1}`);
        const colAriza = document.getElementById(`colAriza${i+1}`);
        if (ilce) {
            colTuketim.style.display = 'block';
            colAriza.style.display = 'block';
            fetchAndRenderMapChart(ilce.id, ilce.ad, start, end, `chartMapTuketim${i+1}`, 'Tüketim (kWh)', '#3498db', 'miktar_kwh', `/api/tuketim-bolgesel`);
            fetchAndRenderMapChart(ilce.id, ilce.ad, start, end, `chartMapAriza${i+1}`, 'Arıza Sayısı', '#e74c3c', 'ariza_sayisi', `/api/ariza-bolgesel`);
        } else {
            colTuketim.style.display = 'none';
            colAriza.style.display = 'none';
        }
    }
}

// ---  FETCH FONKSİYONU ---
function fetchKDSComparison(id1, id2, start, end) {
    fetch(`/api/bolge-karsilastirma?ilce1=${id1}&ilce2=${id2}&baslangic=${start}&bitis=${end}`)
        .then(r => r.json())
        .then(data => {
            const kdsPanel = document.getElementById('kdsKarsilastirmaPanel');
            const kdsIcon = document.getElementById('kdsKarsilastirmaIcon');
            const kdsBadge = document.getElementById('kdsKarsilastirmaBadge');
            const kdsBaslik = document.getElementById('kdsKarsilastirmaBaslik');
            const kdsMesaj = document.getElementById('kdsKarsilastirmaMesaj');
            const kdsOneri = document.getElementById('kdsKarsilastirmaOneri');
            
            const karar = data.kds_karari;
            
            // Paneli görünür yap
            kdsPanel.style.display = 'flex';
            
            // İçerikleri Doldur
            kdsBaslik.innerText = karar.baslik;
            kdsMesaj.innerText = karar.mesaj;
            kdsOneri.innerText = karar.oneri;
            
            // Sınıfları Temizle
            kdsPanel.classList.remove('kds-danger', 'kds-warning', 'kds-success');

            // Risk Seviyesine Göre Renk ve İkon
            if (karar.risk_level === 'yuksek') {
                kdsPanel.classList.add('kds-danger');
                kdsIcon.innerText = '🚨';
                kdsBadge.innerText = 'KRİTİK RİSK';
            } else if (karar.risk_level === 'orta') {
                kdsPanel.classList.add('kds-warning');
                kdsIcon.innerText = '⚠️';
                kdsBadge.innerText = 'DİKKAT';
            } else {
                kdsPanel.classList.add('kds-success');
                kdsIcon.innerText = '✅';
                kdsBadge.innerText = 'STABİL';
            }
        })
        .catch(err => console.log("KDS Hatası:", err));
}
// ------------------------------------------

function fetchAndRenderMapChart(ilceId, ilceAdi, start, end, canvasId, label, color, dataKey, apiUrl) {
    fetch(`${apiUrl}?ilceId=${ilceId}&baslangic=${start}&bitis=${end}`)
        .then(r => r.json())
        .then(data => {
            const ctx = document.getElementById(canvasId).getContext('2d');
            if (charts[canvasId]) charts[canvasId].destroy();
            charts[canvasId] = new Chart(ctx, {
                type: 'bar',
                data: { labels: data.map(d => d.ay), datasets: [{ label: `${ilceAdi} - ${label}`, data: data.map(d => d[dataKey]), backgroundColor: color, borderRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        });
}

// --- DASHBOARD FONKSİYONLARI ---
function updateDashboard() {
    const tarih = document.getElementById('kpiDate').value;
    if (!tarih) return alert("Lütfen bir tarih seçiniz!");

    fetch(`/api/kpi-metrics?tarih=${tarih}`).then(res => res.json()).then(data => {
        const formatter = new Intl.NumberFormat('tr-TR');
        document.getElementById('kpiTuketim').innerText = formatter.format(data.tuketim) + " kWh";
        const degisimEl = document.getElementById('kpiDegisim');
        if (data.degisim > 0) degisimEl.innerHTML = `<span style="color: #e74c3c;">▲ %${data.degisim}</span>`;
        else if (data.degisim < 0) degisimEl.innerHTML = `<span style="color: #2ecc71;">▼ %${data.degisim}</span>`;
        else degisimEl.innerText = "%0.0";
        document.getElementById('kpiSampiyon').innerText = data.sampiyon;
        document.getElementById('kpiKesinti').innerText = data.kesinti + " Adet";
    });

    fetch(`/api/tuketim-tip-dagilim?tarih=${tarih}`).then(res => res.json()).then(data => {
        const ctx = document.getElementById('chartTipDagilim').getContext('2d');
        if (tipChart) tipChart.destroy();
        const typeColors = { 'Metropol': '#3498db', 'Sanayi': '#e67e22', 'Turizm': '#2ecc71', 'Kırsal': '#9b59b6' };
        tipChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: data.map(d => d.tip), datasets: [{ data: data.map(d => d.toplam), backgroundColor: data.map(d => typeColors[d.tip] || '#95a5a6') }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Toplam Tüketim Dağılımı' } } }
        });
    });
}

function updateTop8Charts() {
    const s = document.getElementById('top8Start').value;
    const e = document.getElementById('top8End').value;
    
    fetch(`/api/top8-tuketim?baslangic=${s}&bitis=${e}`).then(r=>r.json()).then(data => {
        const ctx = document.getElementById('chartTop8Tuketim').getContext('2d');
        if(top8TuketimChart) top8TuketimChart.destroy();
        top8TuketimChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: data.map(d=>d.ilce_adi), datasets: [{ label: 'En Çok Tüketen 8 İlçe (kWh)', data: data.map(d=>d.toplam), backgroundColor: '#2ecc71' }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false } 
        });
    });

    fetch(`/api/top8-ariza?baslangic=${s}&bitis=${e}`).then(r=>r.json()).then(data => {
        const ctx = document.getElementById('chartTop8Ariza').getContext('2d');
        if(top8ArizaChart) top8ArizaChart.destroy();
        top8ArizaChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: data.map(d=>d.ilce_adi), datasets: [{ label: 'En Çok Kesinti Yaşayan 8 İlçe', data: data.map(d=>d.sayi), backgroundColor: '#e74c3c' }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
        });
    });
}

function getTrendData() { const s = document.getElementById('trendStart').value, e = document.getElementById('trendEnd').value; fetch(`/api/tuketim-trend?baslangic=${s}&bitis=${e}`).then(r=>r.json()).then(data => { const ctx = document.getElementById('chartTrend').getContext('2d'); if (trendChart) trendChart.destroy(); trendChart = new Chart(ctx, { type: 'line', data: { labels: data.map(d=>d.ay), datasets: [{ label: 'Toplam Tüketim', data: data.map(d=>d.toplam_miktar), borderColor: '#ff8819', backgroundColor: 'rgba(255, 136, 25, 0.2)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false } }); }); }

// --- KDS FONKSİYONLARI ---

// 1. TÜKETİM TAHMİN KDS 
function kdsAnalizMotoru(gecmisVeriler, tahminVeriler) {
    if (!gecmisVeriler || gecmisVeriler.length === 0 || !tahminVeriler || tahminVeriler.length === 0) return null;
    const ortalamaGecmis = gecmisVeriler.reduce((a, b) => a + b, 0) / gecmisVeriler.length;
    const ortalamaTahmin = tahminVeriler.reduce((a, b) => a + b, 0) / tahminVeriler.length;
    const artisOrani = ((ortalamaTahmin - ortalamaGecmis) / ortalamaGecmis) * 100;

    let sonuc = { oran: Math.abs(artisOrani).toFixed(1), durum: "", mesaj: "", renk: "" };

    if (artisOrani <= 10) {
        sonuc.durum = "OLAĞAN BÜYÜME";
        sonuc.mesaj = "✅ Tüketim artışı olağan seviyededir. Mevcut işletme bütçesi ve rutin bakım planı yeterlidir. Ek yatırım gerekmez.";
        sonuc.renk = "kds-success"; 
    } else if (artisOrani > 10 && artisOrani <= 25) {
        sonuc.durum = "DİKKAT ÇEKEN ARTIŞ";
        sonuc.mesaj = "⚠️ Bölgesel yük artışı hızlandı. Arıza ekiplerinin bu bölgedeki devriye sıklığı artırılmalı ve trafo doluluk oranları kontrol edilmelidir.";
        sonuc.renk = "kds-warning";
    } else {
        sonuc.durum = "KRİTİK ARTIŞ";
        sonuc.mesaj = "🚨 Tüketimde agresif bir patlama var (%25+). Kaçak kullanım taraması yapılmalı ve trafo güç artırımı ACİL olarak yatırım planına alınmalı.";
        sonuc.renk = "kds-danger";
    }
    return sonuc;
}

function updateTahminChart() { 
    const ilceId = document.getElementById('tahminIlce').value;
    const ceyrek = document.getElementById('tahminCeyrek').value; 
    const kartDiv = document.getElementById('tahminAnalizKarti');
    kartDiv.style.display = 'none';

    fetch(`/api/tuketim-tahmin?ilceId=${ilceId}&ceyrek=${ceyrek}`)
        .then(r => r.json())
        .then(data => { 
            const ctx = document.getElementById('chartTahmin').getContext('2d'); 
            if (tahminChart) tahminChart.destroy(); 
            tahminChart = new Chart(ctx, { 
                type: 'line', 
                data: { labels: data.labels, datasets: [{ label: '2024-2025 Ort.', data: data.ortalama, borderColor: '#3498db', tension: 0.3, fill: true }, { label: '2026 Tahmini', data: data.tahmin, borderColor: '#e74c3c', borderDash: [5, 5], tension: 0.3 }] }, 
                options: { responsive: true, maintainAspectRatio: false } 
            }); 

            const analiz = kdsAnalizMotoru(data.ortalama, data.tahmin);
            if (analiz) {
                kartDiv.style.display = 'flex'; 
                kartDiv.className = `kds-card ${analiz.renk}`; 
                document.getElementById('kdsOran').innerText = `%${analiz.oran}`;
                document.getElementById('kdsBadge').innerText = analiz.durum;
                document.getElementById('kdsMesaj').innerText = analiz.mesaj;
            }
        }); 
}

// 2. KESİNTİ ANALİZ 
function kesintiAnalizMotoru(data) {
    if (!data || data.length === 0) {
        document.getElementById('kesintiAnalizKarti').style.display = 'none';
        return;
    }
    
    // En yüksek sorunu bul
    const enBuyukSorun = data.reduce((prev, current) => (prev.sayi > current.sayi) ? prev : current);

    const kart = document.getElementById('kesintiAnalizKarti');
    const iconDiv = document.getElementById('kesintiIcon');
    const baslik = document.getElementById('kesintiBaslik');
    const mesaj = document.getElementById('kesintiMesaj');
    const actionBadge = document.getElementById('kesintiAction');

    kart.style.display = 'flex';
    kart.className = 'kds-card'; // Reset

    switch (enBuyukSorun.neden) {
        case 'Eski Altyapı':
            kart.classList.add('kds-danger');
            iconDiv.innerHTML = '🏗️';
            baslik.innerText = 'KRİTİK: ALTYAPI YETERSİZLİĞİ';
            mesaj.innerText = `Bölgedeki kesintilerin çoğunluğu (${enBuyukSorun.sayi} adet) eskiyen şebeke elemanlarından kaynaklanıyor.`;
            actionBadge.innerText = '🚀 ÖNERİ: 2026 Yatırım Planına "Şebeke Yenileme" eklensin.';
            actionBadge.className = 'badge bg-danger text-white';
            break;
        case 'Yüksek Talep':
            kart.classList.add('kds-warning');
            iconDiv.innerHTML = '⚡';
            baslik.innerText = 'UYARI: KAPASİTE AŞIMI';
            mesaj.innerText = `Bölgedeki trafolar aşırı yüklenme (${enBuyukSorun.sayi} adet) nedeniyle zorlanıyor.`;
            actionBadge.innerText = '⚖️ ÖNERİ: Trafo gücü artırımı için yatırım yapılmalı.';
            actionBadge.className = 'badge bg-warning text-dark';
            break;
        case 'Olumsuz Hava Koşulları':
            kart.classList.add('kds-info');
            iconDiv.innerHTML = '⛈️';
            baslik.innerText = 'DIŞ ETKEN: HAVA KOŞULLARI';
            mesaj.innerText = `Kesintiler mevsimsel fırtına ve yağış kaynaklı (${enBuyukSorun.sayi} adet).`;
            actionBadge.innerText = '🌳 ÖNERİ: Havai hatlarda yer altı kablolama yatırımları kademeli olarak artırılmalıdır.';
            actionBadge.className = 'badge bg-info text-white';
            break;
        case 'Ekipman Arızası':
            kart.classList.add('kds-danger');
            iconDiv.innerHTML = '🛠️';
            baslik.innerText = 'TEKNİK ARIZA: EKİPMAN SORUNU';
            mesaj.innerText = `Kesici/Ayırıcı arızaları (${enBuyukSorun.sayi} adet) yoğunlukta.`;
            actionBadge.innerText = '🔍 ÖNERİ: Hizmet sürekliliğini sağlamak amacıyla, alternatif ekipman yatırımları artırılmalıdır.';
            actionBadge.className = 'badge bg-dark text-white';
            break;
        default:
            kart.style.borderLeftColor = '#95a5a6';
            iconDiv.innerHTML = 'ℹ️';
            baslik.innerText = 'GENEL ANALİZ';
            mesaj.innerText = `En çok karşılaşılan kesinti nedeni: ${enBuyukSorun.neden} (${enBuyukSorun.sayi} adet).`;
            actionBadge.innerText = '✅ Rutin kontroller devam etmeli.';
            actionBadge.className = 'badge bg-secondary text-white';
    }
}

function updatePieChart() { 
    const id = document.getElementById('pieIlce').value; 
    fetch(`/api/kesinti-nedenleri?ilceId=${id}`)
        .then(r => r.json())
        .then(data => { 
            if(pieChart) pieChart.destroy(); 
            pieChart = new Chart(document.getElementById('chartPie'), { 
                type: 'pie', 
                data: { labels: data.map(d => d.neden), datasets: [{ data: data.map(d => d.sayi), backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#95a5a6'] }] }, 
                options: { responsive: true } 
            });
            
            kesintiAnalizMotoru(data);
        }); 
}

// AÇILIŞ
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard(); 
    updateTop8Charts(); 
    updateTahminChart(); 
    updatePieChart();
});