# Pathbreak TD - MVP

Tower Defense oyunu MVP versiyonu. BTD6 derinliği + Kingdom Rush tadı + modern roguelite tempo hedefiyle geliştirilmiştir.

## 🎮 Oyun Özellikleri

### MVP Kapsamı

- **Tek Harita**: Ana yol + opsiyonel çatal (barikat ile kontrol)
- **4 Kule Tipi**:
  - 🏹 Okçu: Tek hedef, kritik vuruş
  - ❄️ Donmuş: Yavaşlatma ve dondurma
  - 💣 Topçu: Zırh delme, AoE hasar, sarsma
  - 🔮 Büyücü: Magic/AoE, büyü direnci delme, yanma efekti
- **4 Düşman Tipi**:
  - Runner: Hızlı, düşük HP
  - Tank: Zırhlı, yavaş
  - Swarm: Çok sayıda küçük
  - Mini-Boss: Yüksek HP + zırh (10. dalga)
- **10 Dalga**: Her dalga artan zorluk
- **Basit Ekonomi**: Altın sistemi, kule satın alma/yükseltme/satma
- **Panic Token**: Run başına 1 adet, dalga kurtarma (skor cezası)

## 🚀 Nasıl Oynanır

1. **Başlat** butonuna tıklayın
2. Hazırlık ekranında sonraki dalga hakkında bilgi alın
3. **Hazırım** butonuna tıklayarak dalgayı başlatın
4. Sağ panelden kule seçin ve haritaya yerleştirin
5. Kuleleri yükseltmek için kuleye tıklayın
6. Düşmanları durdurmaya çalışın!

### Kontroller

- **Mouse**: Kule yerleştirme ve seçimi
- **1x / 2x Hız**: Oyun hızını kontrol edin
- **Panic Token**: Acil durumlarda tüm düşmanları öldürür (skor cezası)

## 📁 Proje Yapısı

```
Pathbreak/
├── index.html          # Ana HTML dosyası
├── style.css           # Stil dosyası
├── game.js             # Ana oyun dosyası
├── core/               # Çekirdek sistemler
│   ├── state.js        # State yönetimi
│   ├── gameLoop.js     # Oyun döngüsü
│   ├── map.js          # Harita sistemi
│   └── touchControls.js # Touch kontrolleri (mobil)
├── entities/           # Oyun varlıkları
│   ├── Enemy.js        # Düşman sınıfı
│   ├── Boss.js         # Boss sınıfı (faz sistemi)
│   ├── Tower.js        # Kule sınıfı
│   └── Projectile.js   # Mermi havuzu
├── systems/            # Oyun sistemleri
│   ├── WaveSystem.js   # Dalga sistemi
│   ├── EconomySystem.js # Ekonomi sistemi
│   ├── ArtifactSystem.js # Artifact sistemi (Roguelite)
│   └── ProgressSystem.js # Meta ilerleme sistemi (localStorage)
└── ui/                 # Kullanıcı arayüzü
    ├── hud.js          # HUD yönetimi
    ├── panels.js       # Panel yönetimi
    └── artifactUI.js   # Artifact UI yönetimi
```

## 🛠️ Teknik Detaylar

- **Vanilla JavaScript**: ES6 modülleri
- **Canvas API**: Render sistemi
- **Object Pooling**: Mermi performansı için
- **Immutable State**: State yönetimi
- **Fixed Timestep**: Oyun döngüsü

## 🎯 MVP Başarı Kriterleri

- ✅ İlk oyunda anlaşılır
- ✅ 10+ run'da farklı kule dizilimi denenir
- ✅ Mini-boss "aha" anı yaşatır
- ✅ FPS stabil, input gecikmesi yok

## ✅ Faz 2: Artifact Sistemi (Roguelite) - TAMAMLANDI

- ✅ Run başında artifact seçimi
- ✅ Mini-boss sonrası (dalga 10) artifact seçimi
- ✅ 3'ten 1 seçim mekaniği
- ✅ 12 farklı artifact:
  - **Hasar Artifactleri**: Buz Kırılganlığı, Kritik Ustası, Zırh Kırıcı
  - **Hız Artifactleri**: Hızlı Ateş, Kule Odaklanması
  - **Ekonomi Artifactleri**: Altın Dokunuş, Verimli Yükseltmeler
  - **Savunma Artifactleri**: Kale, Yenilenme
  - **Özel Artifactler**: Zincir Reaksiyon, Yavaşlatma Ustası, Kule Sinerjisi
- ✅ Artifact efektleri oyun mekaniğine entegre edildi
- ✅ Aktif artifactler ekranda gösteriliyor

## 🔜 Sonraki Faz Planı

### ✅ Faz 3: Yeni İçerik - TAMAMLANDI

- ✅ **Yeni Kule**: Büyücü (Magic/AoE)
  - Büyü direnci delme
  - Seviye 3'te yanma efekti (DoT)
  - Geniş alan hasarı
- ✅ **Yeni Haritalar**: 3 farklı harita tipi
  - Default: S şeklinde, çatal desteği
  - Spiral: Dıştan içe spiral yol
  - Zigzag: Zikzak yol düzeni
- ✅ **Boss Mekaniği**: Özel yetenekler, fazlar
  - 3 fazlı boss sistemi
  - Faz 2: Kalkan aktif
  - Faz 3: Rage mode (hız artışı)
  - Summon yeteneği (düşman çağırma)
  - Her fazda güçlenme

### ✅ Faz 4: Meta İlerleme - TAMAMLANDI

- ✅ **Skor Tablosu**: localStorage tabanlı, en yüksek 10 skor
  - Skor, dalga, artifact bilgileri
  - Tarih/saat gösterimi
- ✅ **Unlock Sistemi**: 
  - Kuleler: Büyücü 5 run sonra unlock
  - Haritalar: Spiral 3 run, Zigzag 7 run sonra unlock
  - Görsel kilit göstergesi
- ✅ **Achievement Sistemi**: 8 farklı achievement
  - İlk Zafer, Yüksek Skor, Mükemmel Oyun
  - Veteran, Katil
  - Unlock achievement'leri
  - Popup bildirimleri
- ✅ **İstatistik Takibi**:
  - Toplam run sayısı
  - Toplam dalga sayısı
  - Toplam düşman öldürme
  - En yüksek skor ve dalga
- ✅ **Kalıcı Upgrade Sistemi**: Altyapı hazır
  - Başlangıç altını artışı
  - Başlangıç canı artışı
  - Altın çarpanı

### ✅ Faz 5: Mobil Optimizasyon - TAMAMLANDI

- ✅ **Touch Kontrolleri**: 
  - Dokunmatik ekran desteği
  - Tap ve double-tap desteği
  - Drag threshold (yanlışlıkla tıklama önleme)
  - Double-tap ile hızlı yükseltme
- ✅ **Responsive UI İyileştirmeleri**:
  - Mobil görünüm optimizasyonu
  - Küçük ekranlar için layout düzenlemeleri
  - Touch-friendly buton boyutları
  - Viewport meta tag ayarları
  - PWA desteği (Apple/Android)
- ✅ **Performans Optimizasyonları**:
  - Mobilde 30 FPS (desktop 60 FPS)
  - Mermi havuzu limiti (mobilde 50, desktop 100)
  - Render skip (mobilde her 2 frame'de bir)
  - Delta time clamping (spike önleme)
  - Canvas touch optimizasyonları
- ✅ **Mobil Özel Özellikler**:
  - Touch action: none (zoom önleme)
  - User select: none (metin seçimi önleme)
  - Tap highlight optimizasyonu
  - Dynamic viewport height (dvh) desteği

## 📝 Notlar

- MVP scope: 2-3 haftada oynanabilir, zevk veren, genişlemeye hazır çekirdek
- Teknik borç oluşturmadan genişleyebilir mimari
- Her kule tipi farklı bir rolü karşılar
- Hiçbir kule her şeyi çözmez, counter zorunlu

## 🐛 Bilinen Sorunlar

- Barikat toggle mekaniği henüz UI'da yok (kod hazır)
- AoE hasar görsel feedback'i eksik
- Mobil dokunmatik kontroller optimize edilmeli

## 📄 Lisans

Bu proje kişisel portfolyo projesidir.

