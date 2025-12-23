# Konya Nöbetçi Eczaneler

Konya il merkezi ve ilçelerindeki güncel nöbetçi eczane listesi.

## Özellikler

- ✅ Otomatik veri çekme (web sitesinden)
- ✅ Arama ve filtreleme
- ✅ Modern ve responsive tasarım
- ✅ Semantik HTML ve Schema.org desteği
- ✅ Telefon ve harita entegrasyonu

## Veri Güncelleme

### Otomatik Güncelleme

Sayfa açıldığında otomatik olarak web sitesinden güncel verileri çeker. Eğer web sitesine erişilemezse, yedek olarak `pharmacies.json` dosyasından veriler yüklenir.

### Manuel Güncelleme

Eğer otomatik güncelleme çalışmazsa, aşağıdaki komutla manuel olarak güncelleyebilirsiniz:

```bash
# Node.js scripti ile
node update-pharmacies.js

# Veya npm script olarak
npm run update
```

### GitHub Actions ile Otomatik Güncelleme (Opsiyonel)

Her gün otomatik güncelleme için `.github/workflows/update-pharmacies.yml` dosyası oluşturabilirsiniz:

```yaml
name: Update Pharmacies

on:
  schedule:
    - cron: '0 0 * * *' # Her gün gece yarısı
  workflow_dispatch: # Manuel tetikleme

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd nobetci-eczaneler && npm run update
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add nobetci-eczaneler/pharmacies.json
          git diff --staged --quiet || git commit -m "Update pharmacies data"
          git push
```

## Kullanım

1. `index.html` dosyasını bir web sunucusunda açın
2. Sayfa otomatik olarak güncel verileri yükler
3. Arama kutusunu kullanarak eczane arayabilirsiniz
4. Bölge filtresi ile belirli bölgeleri filtreleyebilirsiniz

## Veri Kaynağı

Veriler [konyanobetcieczaneleri.com](https://www.konyanobetcieczaneleri.com/) adresinden alınmaktadır.

## SEO ve Optimizasyon

### SEO Özellikleri
- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags (Facebook, Twitter)
- ✅ Structured Data (JSON-LD Schema.org)
- ✅ Canonical URL
- ✅ Semantic HTML5
- ✅ Mobile-first responsive design
- ✅ Sitemap.xml entegrasyonu
- ✅ Robots.txt uyumluluğu

### Performans Optimizasyonları
- ✅ Debounce ile arama optimizasyonu (300ms)
- ✅ Lazy loading hazırlığı
- ✅ Font display=swap
- ✅ DNS prefetch
- ✅ Will-change CSS hints
- ✅ Reduced motion desteği (accessibility)
- ✅ Optimize edilmiş CSS ve JS

### PWA Özellikleri
- ✅ Web App Manifest
- ✅ Theme color
- ✅ Apple mobile web app meta tags
- ✅ Offline çalışma hazırlığı

## Teknolojiler

- HTML5 (Semantic)
- CSS3 (Modern CSS özellikleri, CSS Variables)
- Vanilla JavaScript (ES6+, Debounce, Performance optimizations)
- Node.js (Güncelleme scripti için)
- Schema.org (Structured Data)
- PWA (Progressive Web App) hazırlığı

