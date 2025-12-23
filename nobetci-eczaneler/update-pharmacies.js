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
  
  // Basit regex ve string işlemleri ile parse et
  // Tablo satırlarını bul
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error('Tablo bulunamadı');
  }

  const tableContent = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let rowIndex = 0;

  while ((match = rowRegex.exec(tableContent)) !== null) {
    rowIndex++;
    if (rowIndex === 1) continue; // Başlık satırını atla

    const rowContent = match[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      // HTML etiketlerini temizle
      let cellText = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
      
      cells.push(cellText);
    }

    if (cells.length < 4) continue;

    const region = cells[0] || '';
    const name = cells[1] || '';
    const address = cells[2] || '';
    let phone = cells[3] || '';

    // Telefon numarasını temizle
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('90')) {
      phone = phone.substring(2);
    }
    if (phone.length === 10 && !phone.startsWith('0')) {
      phone = '0' + phone;
    }

    // Geçerli veri kontrolü
    if (name && address && phone && phone.length >= 10) {
      // İlçe bilgisini bölgeden çıkar
      const districtMatch = region.match(/\((.*?)\)/);
      const district = districtMatch ? districtMatch[1] : '';
      const cleanRegion = region.replace(/\(.*?\)/g, '').trim();

      pharmacies.push({
        region: cleanRegion || region,
        district: district,
        name: name.trim(),
        address: address.trim(),
        phone: phone
      });
    }
  }

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
    process.exit(1);
  }
}

// Script çalıştırılıyorsa
if (require.main === module) {
  updatePharmacies();
}

module.exports = { updatePharmacies, parsePharmacies };

