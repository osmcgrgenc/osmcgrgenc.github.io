#!/usr/bin/env node

/**
 * Konya Nöbetçi Eczaneler Güncelleme Scripti
 * 
 * Bu script web sitesinden güncel nöbetçi eczane verilerini çekip
 * pharmacies.json dosyasına kaydeder.
 * 
 * Kullanım:
 *   node update-pharmacies.js
 * 
 * Veya npm script olarak:
 *   npm run update-pharmacies
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SOURCE_URL = 'https://www.konyanobetcieczaneleri.com/';
const OUTPUT_FILE = path.join(__dirname, 'pharmacies.json');

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function parsePharmacies(html) {
  const pharmacies = [];
  const $ = cheerio.load(html);
  
  // Tüm tabloları bul
  $('table').each((tableIndex, table) => {
    const $table = $(table);
    
    // Bu tabloda başlık satırı var mı kontrol et
    const hasHeader = $table.find('td').text().includes('Bölge') || 
                      $table.find('td').text().includes('Eczane');
    
    if (!hasHeader) return; // Başlık yoksa bu tabloyu atla
    
    // Tablodaki tüm satırları işle
    $table.find('tr').each((rowIndex, row) => {
      const $row = $(row);
      const cells = [];
      
      // Başlık satırını atla
      const rowText = $row.text().toLowerCase();
      if (rowText.includes('bölge') && rowText.includes('eczane')) {
        return;
      }
      
      // Satırdaki tüm hücreleri al
      let phoneFound = false;
      $row.find('td').each((cellIndex, cell) => {
        const $cell = $(cell);
        let cellText = '';
        
        // İlk 3 hücre: Bölge, Eczane, Adres
        if (cellIndex < 3) {
          cellText = $cell.text().trim();
        } else {
          // 4. hücreden itibaren telefon numarasını ara
          // Telefon linkini kontrol et (href="tel:" veya href="tel://")
          const $phoneLink = $cell.find('a[href^="tel"]');
          if ($phoneLink.length > 0 && !phoneFound) {
            let phone = $phoneLink.attr('href').replace(/^tel:?\/?\/?/, '').replace(/\D/g, '');
            if (phone.startsWith('90')) phone = phone.substring(2);
            if (phone.length === 10 && !phone.startsWith('0')) phone = '0' + phone;
            // Eğer linkten numara çıkarılamazsa, link metnini kullan
            if (!phone || phone.length < 10) {
              phone = $phoneLink.text().trim().replace(/\D/g, '');
              if (phone.startsWith('90')) phone = phone.substring(2);
              if (phone.length === 10 && !phone.startsWith('0')) phone = '0' + phone;
            }
            if (phone && phone.length >= 10) {
              cellText = phone;
              phoneFound = true;
            }
          } else {
            // Normal hücre içeriği - telefon numarası ara
            cellText = $cell.text().trim();
            // Hücre içinde telefon numarası var mı kontrol et (10-11 haneli)
            const phoneMatch = cellText.match(/(\d{10,11})/);
            if (phoneMatch && !phoneFound) {
              let phone = phoneMatch[1].replace(/\D/g, '');
              if (phone.startsWith('90')) phone = phone.substring(2);
              if (phone.length === 10 && !phone.startsWith('0')) phone = '0' + phone;
              if (phone.length >= 10) {
                cellText = phone;
                phoneFound = true;
              }
            }
          }
        }
        
        // İlk 3 hücreyi her zaman ekle, telefon sadece bir kez
        if (cellIndex < 3) {
          if (cellText) {
            cells.push(cellText);
          }
        } else if (phoneFound && cellText && cells.length === 3) {
          // Telefon numarasını ekle
          cells.push(cellText);
          return false; // Break - telefon bulundu
        }
      });
      
      // En az 3 hücre olmalı (bölge, isim, adres)
      if (cells.length < 3) return;
      
      const region = cells[0] || '';
      const name = cells[1] || '';
      const address = cells[2] || '';
      let phone = cells[3] || '';
      
      // Telefon numarasını temizle ve formatla
      if (phone) {
        phone = phone.replace(/\D/g, '');
        if (phone.startsWith('90') && phone.length > 10) {
          phone = phone.substring(2);
        }
        if (phone.length === 10 && !phone.startsWith('0')) {
          phone = '0' + phone;
        }
      }
      
      // Geçerli veri kontrolü
      if (name && name.length > 1 && address && address.length > 5) {
        // İlçe bilgisini bölgeden çıkar
        const districtMatch = region.match(/\((.*?)\)/);
        const district = districtMatch ? districtMatch[1] : '';
        const cleanRegion = region.replace(/\(.*?\)/g, '').trim();
        
        pharmacies.push({
          region: cleanRegion || region || 'Bilinmiyor',
          district: district,
          name: name.trim(),
          address: address.trim(),
          phone: (phone && phone.length >= 10) ? phone : ''
        });
      }
    });
  });
  
  return pharmacies;
}

async function updatePharmacies() {
  console.log('🔄 Nöbetçi eczane verileri güncelleniyor...');
  console.log(`📡 Kaynak: ${SOURCE_URL}`);

  try {
    // HTML'i çek
    console.log('⏳ Web sitesinden veri çekiliyor...');
    const html = await fetchHTML(SOURCE_URL);
    
    // Parse et
    console.log('📊 Veriler parse ediliyor...');
    const pharmacies = parsePharmacies(html);

    if (pharmacies.length === 0) {
      throw new Error('Hiç eczane verisi bulunamadı');
    }

    // JSON'a kaydet
    const jsonData = JSON.stringify(pharmacies, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonData, 'utf8');

    console.log(`✅ Başarılı! ${pharmacies.length} eczane verisi güncellendi.`);
    console.log(`📁 Dosya: ${OUTPUT_FILE}`);
    
    // İstatistikler
    const regions = new Set(pharmacies.map(p => p.region));
    const districts = new Set(pharmacies.filter(p => p.district).map(p => p.district));
    
    console.log('\n📈 İstatistikler:');
    console.log(`   - Toplam Eczane: ${pharmacies.length}`);
    console.log(`   - Bölge Sayısı: ${regions.size}`);
    console.log(`   - İlçe Sayısı: ${districts.size}`);

  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Stack:', error.stack);
    
    // Debug için HTML'in bir kısmını göster
    if (error.message.includes('bulunamadı')) {
      try {
        const html = await fetchHTML(SOURCE_URL);
        console.log('\n🔍 Debug Bilgileri:');
        console.log('HTML uzunluğu:', html.length);
        console.log('Tablo sayısı:', (html.match(/<table/gi) || []).length);
        console.log('TR sayısı:', (html.match(/<tr/gi) || []).length);
        console.log('TD sayısı:', (html.match(/<td/gi) || []).length);
        
        // İlk veri satırını bul
        const firstDataRow = html.match(/<tr[^>]*bgcolor[^>]*>[\s\S]{100,2000}?<\/tr>/i);
        if (firstDataRow) {
          console.log('\n📋 İlk veri satırı örneği:');
          console.log(firstDataRow[0].substring(0, 500));
        }
        
        // Parse denemesi
        const testParse = parsePharmacies(html);
        console.log('\n🧪 Test parse sonucu:', testParse.length, 'eczane bulundu');
        if (testParse.length > 0) {
          console.log('İlk eczane:', JSON.stringify(testParse[0], null, 2));
        }
      } catch (fetchError) {
        console.error('HTML çekilemedi:', fetchError.message);
      }
    }
    
    process.exit(1);
  }
}

// Script çalıştırılıyorsa
if (require.main === module) {
  updatePharmacies();
}

module.exports = { updatePharmacies, parsePharmacies };

