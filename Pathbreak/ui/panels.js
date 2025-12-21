// Panel yönetimi (kule seçimi, bilgileri)
class PanelManager {
    constructor() {
        this.elements = {
            towerButtons: document.querySelectorAll('.tower-btn'),
            selectedTowerInfo: document.getElementById('selected-tower-info'),
            selectedTowerName: document.getElementById('selected-tower-name'),
            towerStats: document.getElementById('tower-stats'),
            towerUpgrades: document.getElementById('tower-upgrades'),
            upgradeBtn: document.getElementById('upgrade-btn'),
            towerLevel: document.getElementById('tower-level'),
            upgradeCost: document.getElementById('upgrade-cost'),
            sellBtn: document.getElementById('sell-btn')
        };
        
        this.selectedTower = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Kule butonları
        this.elements.towerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const towerType = btn.dataset.tower;
                this.selectTowerType(towerType);
            });
        });
        
        // Yükseltme butonu
        this.elements.upgradeBtn.addEventListener('click', () => {
            if (this.onUpgrade) {
                this.onUpgrade(this.selectedTower);
            }
        });
        
        // Sat butonu
        this.elements.sellBtn.addEventListener('click', () => {
            if (this.onSell) {
                this.onSell(this.selectedTower);
            }
        });
    }
    
    // Kule tipi seç
    selectTowerType(towerType) {
        // Tüm butonlardan seçimi kaldır
        this.elements.towerButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Seçili butonu işaretle
        const btn = document.querySelector(`[data-tower="${towerType}"]`);
        if (btn) {
            btn.classList.add('selected');
        }
        
        // Placement mode'u ayarla
        if (this.onTowerTypeSelected) {
            this.onTowerTypeSelected(towerType);
        }
    }
    
    // Kule seçimi kaldır
    deselectTowerType() {
        this.elements.towerButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (this.onTowerTypeSelected) {
            this.onTowerTypeSelected(null);
        }
    }
    
    // Kule bilgilerini göster
    showTowerInfo(tower, gold) {
        this.selectedTower = tower;
        
        const towerNames = {
            archer: 'Okçu Kulesi',
            freeze: 'Donmuş Kule',
            cannon: 'Topçu Kulesi',
            mage: 'Büyücü Kulesi'
        };
        
        this.elements.selectedTowerName.textContent = towerNames[tower.type] || tower.type;
        this.elements.towerLevel.textContent = tower.level;
        
        // İstatistikler
        let statsHTML = '';
        statsHTML += `<div class="stat-row"><span>Hasar:</span><span>${tower.damage}</span></div>`;
        statsHTML += `<div class="stat-row"><span>Menzil:</span><span>${tower.range}</span></div>`;
        statsHTML += `<div class="stat-row"><span>Atış Hızı:</span><span>${(tower.fireRate / 1000).toFixed(1)}s</span></div>`;
        
        if (tower.critChance > 0) {
            statsHTML += `<div class="stat-row"><span>Kritik Şansı:</span><span>${(tower.critChance * 100).toFixed(0)}%</span></div>`;
        }
        
        if (tower.armorPenetration > 0) {
            statsHTML += `<div class="stat-row"><span>Zırh Delme:</span><span>${tower.armorPenetration}</span></div>`;
        }
        
        if (tower.canSlow) {
            statsHTML += `<div class="stat-row"><span>Yavaşlatma:</span><span>✓</span></div>`;
        }
        
        if (tower.canFreeze) {
            statsHTML += `<div class="stat-row"><span>Dondurma:</span><span>✓</span></div>`;
        }
        
        if (tower.canStun) {
            statsHTML += `<div class="stat-row"><span>Sarsma:</span><span>✓</span></div>`;
        }
        
        if (tower.isAoE) {
            statsHTML += `<div class="stat-row"><span>Alan Hasarı:</span><span>${tower.aoeRadius}px</span></div>`;
        }
        
        if (tower.magicResistPenetration > 0) {
            statsHTML += `<div class="stat-row"><span>Büyü Direnci Delme:</span><span>${tower.magicResistPenetration}</span></div>`;
        }
        
        if (tower.canBurn) {
            statsHTML += `<div class="stat-row"><span>Yanma:</span><span>✓</span></div>`;
        }
        
        this.elements.towerStats.innerHTML = statsHTML;
        
        // Yükseltme butonu
        if (tower.level < tower.maxLevel) {
            const upgradeCost = tower.upgradeCost;
            this.elements.upgradeBtn.disabled = gold < upgradeCost;
            this.elements.upgradeCost.textContent = `Maliyet: ${upgradeCost} altın`;
        } else {
            this.elements.upgradeBtn.disabled = true;
            this.elements.upgradeCost.textContent = 'Maksimum seviye';
        }
        
        // Satış değeri
        const sellValue = tower.getSellValue();
        this.elements.sellBtn.textContent = `Sat (${sellValue} altın)`;
        
        // Panel'i göster
        this.elements.selectedTowerInfo.classList.remove('hidden');
    }
    
    // Kule bilgilerini gizle
    hideTowerInfo() {
        this.selectedTower = null;
        this.elements.selectedTowerInfo.classList.add('hidden');
    }
    
    // Altın durumunu güncelle
    updateGold(gold) {
        if (this.selectedTower && this.selectedTower.level < this.selectedTower.maxLevel) {
            const upgradeCost = this.selectedTower.upgradeCost;
            this.elements.upgradeBtn.disabled = gold < upgradeCost;
        }
    }
    
    // Event callback'leri
    setOnTowerTypeSelected(callback) {
        this.onTowerTypeSelected = callback;
    }
    
    setUpgradeCallback(callback) {
        this.onUpgrade = callback;
    }
    
    setSellCallback(callback) {
        this.onSell = callback;
    }
}

export default PanelManager;

