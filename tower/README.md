# 🏰 Tower Defense - Kule Savunma Oyunu

HTML, CSS ve Vanilla JavaScript ile geliştirilmiş, mobil ve dokunmatik destekli tam özellikli bir Tower Defense oyunu.

## 🎮 Oyunu Oyna

Oyunu doğrudan tarayıcınızda açabilirsiniz: `tower/index.html`

## ✨ Özellikler

### 🎯 Temel Oyun Mekanikleri
- **Grid Tabanlı Oyun Alanı**: 5 satır x 10 sütun
- **Düşman İlerlemesi**: Sağdan sola hareket eden düşmanlar
- **Otomatik Ateş**: Kuleler kendi satırlarındaki düşmanlara otomatik ateş eder
- **Can Sistemi**: Düşmanlar sol tarafa ulaştığında can kaybedersiniz
- **Enerji Sistemi**: Kule yerleştirmek için enerji harcayın, düşman öldürerek kazanın

### 🏰 6 Farklı Kule Tipi
| Kule | Maliyet | Özellik |
|------|---------|---------|
| 💜 **Temel** | 50 | Dengeli hasar ve hız |
| 🩵 **Hızlı** | 70 | Çok hızlı ateş, düşük hasar |
| 🧡 **Nişancı** | 100 | Yüksek hasar, tüm satır menzili |
| 💛 **Bomba** | 120 | Alan hasarı (AoE) |
| 💙 **Buz** | 80 | Düşmanları yavaşlatır |
| 💗 **Lazer** | 150 | Sürekli ışın hasarı |

### 👾 4 Farklı Düşman Tipi
- 🔴 **Normal**: Standart düşman
- 🟢 **Hızlı**: Çok hızlı, az can
- ⚫ **Tank**: Yavaş, çok can
- 🟢 **Healer**: Yakındaki düşmanları iyileştirir
- 🟣 **Boss**: Her 5. dalgada, çok güçlü

### ⚡ 4 Power-Up
| Power-Up | Tuş | Etki |
|----------|-----|------|
| 💣 Nükleer | Q | Tüm düşmanları yok eder |
| ❄️ Dondur | W | 5 saniye düşmanları dondurur |
| ⚔️ 2x Hasar | E | 10 saniye çift hasar |
| ❤️ İyileştir | R | +5 can kazanır |

### 🎮 Oyun Özellikleri
- **4 Zorluk Seviyesi**: Kolay, Normal, Zor, Kabus
- **10-20 Dalga**: Zorluk seviyesine göre değişir
- **Combo Sistemi**: Hızlı öldürmelerde bonus puan
- **Kule Yükseltme**: Kuleleri 3 seviyeye kadar yükseltin
- **Kule Satışı**: İstemediğiniz kuleleri satın
- **Dalga Arası Hazırlık**: 3 saniye hazırlık süresi
- **Skor Tablosu**: En yüksek skorlarınızı kaydedin
- **14 Başarım**: Çeşitli hedeflere ulaşarak başarım kazanın

### 📱 Kontroller
**Masaüstü:**
- Tıklama: Kule yerleştir / Kule yönet
- 1-6: Kule tipi seç
- Q/W/E/R: Power-up kullan
- Space/ESC: Duraklat

**Mobil:**
- Dokunma: Kule yerleştir / Kule yönet
- Butonlar: Tüm kontroller ekranda

### 🎨 Görsel Özellikler
- Modern koyu tema
- Parlayan kule ve düşman efektleri
- Patlama ve dondurma animasyonları
- Combo popup'ları
- Floating damage sayıları
- Parçacık efektleri
- Dalga duyuruları

### 📖 Tutorial Sistemi
- Detaylı "Nasıl Oynanır?" ekranı
- Tüm kuleler ve düşmanlar açıklanır
- Power-up'lar ve ipuçları
- Klavye kısayolları listesi

## 🛠️ Teknik Detaylar

- **Dil**: HTML5, CSS3, Vanilla JavaScript
- **Harici Kütüphane**: Yok
- **Oyun Döngüsü**: `requestAnimationFrame`
- **Ses**: Web Audio API
- **Depolama**: LocalStorage (skor ve başarımlar)
- **Responsive**: Mobil uyumlu tasarım

## 📁 Dosya Yapısı

```
tower/
├── index.html    # Ana HTML dosyası
├── style.css     # Tüm stiller
├── script.js     # Oyun mantığı
└── README.md     # Bu dosya
```

## 🚀 Kurulum

1. Dosyaları indirin
2. `index.html` dosyasını tarayıcıda açın
3. Oynamaya başlayın!

Herhangi bir derleme veya kurulum gerektirmez.

## 💡 Oyun İpuçları

1. **İlk dalgalarda** Temel kuleler ile başlayın
2. **Buz kuleleri** + **Hasar kuleleri** = Güçlü kombo
3. **Boss dalgaları** için power-up'ları saklayın
4. **Kuleleri yükseltin** - yeni kule almaktan daha verimli olabilir
5. **Satır başlarına** kule yerleştirin - daha fazla düşmana ulaşır
6. **Healer düşmanları** öncelikli hedef alın

## 🎖️ Başarımlar

- 🎯 İlk Kan - İlk düşmanı öldür
- 🌊 Dayanıklı - 5. dalgaya ulaş
- 🏆 Şampiyon - 10. dalgayı tamamla
- 💀 Katil - 100 düşman öldür
- 👑 Boss Avcısı - Bir boss öldür
- 🏗️ Mimar - 10 kule yerleştir
- ⭐ Puancı - 1000 puan kazan
- 🛡️ Dokunulmaz - Bir dalgayı hasarsız tamamla
- 🎨 Koleksiyoncu - Tüm kule tiplerini kullan
- ⬆️ Güçlendirici - Bir kuleyi max seviyeye yükselt
- 🔥 Combo Ustası - 5x combo yap
- 😈 Kabus Avcısı - Kabus modunda kazan

---

🎮 İyi eğlenceler!
