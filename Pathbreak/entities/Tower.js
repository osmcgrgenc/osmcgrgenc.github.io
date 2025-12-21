// Kule sınıfı - Gelişmiş görsel tasarım
class Tower {
    constructor(type, x, y) {
        this.type = type;
        this.position = { x, y };
        this.level = 1;
        this.maxLevel = 3;
        
        // Tip bazlı özellikler
        const stats = Tower.getStats(type);
        this.range = stats.range;
        this.damage = stats.damage;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;
        this.upgradeCost = stats.upgradeCost;
        this.color = stats.color;
        this.secondaryColor = stats.secondaryColor;
        this.radius = stats.radius;
        this.damageType = stats.damageType;
        
        // Atış sistemi
        this.lastFireTime = 0;
        this.target = null;
        this.justFired = false;
        this.fireAnimProgress = 0;
        
        // Animasyon
        this.rotation = 0; // Kule dönüşü (hedefe doğru)
        this.idleTime = Math.random() * Math.PI * 2; // Rastgele başlangıç
        this.chargeProgress = 0; // Şarj animasyonu
        
        // Özel yetenekler
        this.canSlow = stats.canSlow || false;
        this.canFreeze = stats.canFreeze || false;
        this.canStun = stats.canStun || false;
        this.isAoE = stats.isAoE || false;
        this.aoeRadius = stats.aoeRadius || 0;
        this.critChance = stats.critChance || 0;
        this.armorPenetration = stats.armorPenetration || 0;
        this.magicResistPenetration = stats.magicResistPenetration || 0;
    }
    
    static getStats(type) {
        const baseStats = {
            archer: {
                range: 120,
                damage: 15,
                fireRate: 1000,
                cost: 50,
                upgradeCost: 30,
                radius: 16,
                color: '#5D4037', // Koyu kahverengi (ahşap)
                secondaryColor: '#33691E', // Yeşil (kumaş)
                damageType: 'physical',
                critChance: 0.1
            },
            freeze: {
                range: 100,
                damage: 5,
                fireRate: 1500,
                cost: 75,
                upgradeCost: 40,
                radius: 16,
                color: '#0288D1', // Buz mavisi
                secondaryColor: '#B3E5FC', // Açık buz
                damageType: 'magic',
                canSlow: true,
                canFreeze: true
            },
            cannon: {
                range: 150,
                damage: 40,
                fireRate: 2000,
                cost: 100,
                upgradeCost: 50,
                radius: 18,
                color: '#455A64', // Metal gri
                secondaryColor: '#263238', // Koyu metal
                damageType: 'physical',
                armorPenetration: 5,
                canStun: true,
                isAoE: true,
                aoeRadius: 30
            },
            mage: {
                range: 110,
                damage: 25,
                fireRate: 1200,
                cost: 90,
                upgradeCost: 45,
                radius: 16,
                color: '#7B1FA2', // Mor
                secondaryColor: '#E1BEE7', // Açık mor
                damageType: 'magic',
                isAoE: true,
                aoeRadius: 40,
                magicResistPenetration: 3
            }
        };
        
        return baseStats[type] || baseStats.archer;
    }
    
    // Yükseltme
    upgrade() {
        if (this.level >= this.maxLevel) return false;
        
        this.level++;
        
        // Seviye bonusları
        const levelMultiplier = 1 + (this.level - 1) * 0.5;
        this.damage = Math.floor(Tower.getStats(this.type).damage * levelMultiplier);
        this.range = Math.floor(Tower.getStats(this.type).range * (1 + (this.level - 1) * 0.2));
        
        // Özel yetenekler
        if (this.type === 'archer' && this.level >= 2) {
            this.critChance = 0.25;
        }
        if (this.type === 'freeze' && this.level >= 2) {
            this.canFreeze = true;
        }
        if (this.type === 'cannon' && this.level >= 2) {
            this.armorPenetration = 10;
        }
        if (this.type === 'mage' && this.level >= 2) {
            this.aoeRadius = 50;
            this.magicResistPenetration = 5;
        }
        if (this.type === 'mage' && this.level >= 3) {
            this.canBurn = true;
            this.burnDamage = 5;
            this.burnDuration = 3000;
        }
        
        return true;
    }
    
    // Satış değeri
    getSellValue() {
        return Math.floor((this.cost + (this.level - 1) * this.upgradeCost) * 0.7);
    }
    
    // Hedef bul
    findTarget(enemies) {
        let closest = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            if (enemy.isDead() || enemy.reachedEnd) continue;
            
            const dx = enemy.position.x - this.position.x;
            const dy = enemy.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range && distance < closestDistance) {
                closest = enemy;
                closestDistance = distance;
            }
        }
        
        this.target = closest;
        
        // Hedefe doğru dönüş açısını hesapla
        if (closest) {
            const dx = closest.position.x - this.position.x;
            const dy = closest.position.y - this.position.y;
            this.rotation = Math.atan2(dy, dx);
        }
        
        return closest;
    }
    
    // Atış yapabilir mi?
    canFire(currentTime) {
        return (currentTime - this.lastFireTime) >= this.fireRate;
    }
    
    // Atış yap
    fire(currentTime) {
        if (!this.canFire(currentTime) || !this.target) return null;
        
        this.lastFireTime = currentTime;
        
        // Atış animasyonu
        this.justFired = true;
        this.fireAnimProgress = 1;
        
        const projectile = {
            x: this.position.x,
            y: this.position.y,
            target: this.target,
            damage: this.damage,
            damageType: this.damageType,
            speed: 12,
            radius: 8,
            color: this.color,
            tower: this,
            type: this.type
        };
        
        // Kritik vuruş kontrolü
        if (Math.random() < this.critChance) {
            projectile.damage *= 2;
            projectile.isCrit = true;
            projectile.radius = 10;
        }
        
        return projectile;
    }
    
    // Güncelle (animasyonlar için)
    update(deltaTime) {
        this.idleTime += deltaTime * 0.001;
        
        // Atış animasyonu sönümlemesi
        if (this.fireAnimProgress > 0) {
            this.fireAnimProgress -= deltaTime * 0.005;
            if (this.fireAnimProgress < 0) {
                this.fireAnimProgress = 0;
                this.justFired = false;
            }
        }
        
        // Şarj animasyonu (atış arası)
        if (this.target) {
            const timeSinceLastFire = performance.now() - this.lastFireTime;
            this.chargeProgress = Math.min(1, timeSinceLastFire / this.fireRate);
        } else {
            this.chargeProgress = 0;
        }
    }
    
    // Çiz
    draw(ctx, showRange = false) {
        const time = this.idleTime;
        
        // Menzil gösterimi
        if (showRange) {
            this.drawRange(ctx);
        }
        
        // Gölge
        this.drawShadow(ctx);
        
        // Kule tipine göre çizim
        switch (this.type) {
            case 'archer':
                this.drawArcherTower(ctx, time);
                break;
            case 'freeze':
                this.drawFreezeTower(ctx, time);
                break;
            case 'cannon':
                this.drawCannonTower(ctx, time);
                break;
            case 'mage':
                this.drawMageTower(ctx, time);
                break;
            default:
                this.drawBasicTower(ctx);
        }
        
        // Seviye göstergesi
        this.drawLevelIndicator(ctx);
        
        // Hedef çizgisi
        if (this.target && showRange) {
            this.drawTargetLine(ctx);
        }
        
        // Şarj göstergesi
        if (this.target && this.chargeProgress < 1) {
            this.drawChargeIndicator(ctx);
        }
    }
    
    // Menzil çizimi
    drawRange(ctx) {
        const pulseRadius = this.range + Math.sin(this.idleTime * 2) * 3;
        
        // Dış halka
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.range * 0.8,
            this.position.x, this.position.y, this.range
        );
        gradient.addColorStop(0, 'rgba(242, 183, 5, 0)');
        gradient.addColorStop(1, 'rgba(242, 183, 5, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Çizgi
        ctx.strokeStyle = 'rgba(242, 183, 5, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Gölge çizimi
    drawShadow(ctx) {
        const shadowGradient = ctx.createRadialGradient(
            this.position.x, this.position.y + 4,
            0,
            this.position.x, this.position.y + 4,
            this.radius * 1.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y + 4, this.radius * 1.2, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Okçu Kulesi
    drawArcherTower(ctx, time) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;
        
        // Atış flash efekti
        if (this.justFired) {
            ctx.fillStyle = `rgba(255, 255, 200, ${this.fireAnimProgress * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Taban (taş)
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.arc(x, y + 2, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Ana kule (ahşap)
        const woodGradient = ctx.createLinearGradient(x - r, y, x + r, y);
        woodGradient.addColorStop(0, '#6D4C41');
        woodGradient.addColorStop(0.5, this.color);
        woodGradient.addColorStop(1, '#4E342E');
        ctx.fillStyle = woodGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Ahşap çizgileri
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI + time * 0.1;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * r * 0.3, y + Math.sin(angle) * r * 0.3);
            ctx.lineTo(x + Math.cos(angle) * r * 0.7, y + Math.sin(angle) * r * 0.7);
            ctx.stroke();
        }
        
        // Okçu platformu (yeşil kumaş)
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(x, y - 2, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ok ve yay (hedefe doğru döner)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.target ? this.rotation : time * 0.5);
        
        // Yay
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
        
        // Ok
        ctx.fillStyle = '#FDD835';
        ctx.beginPath();
        ctx.moveTo(r * 0.6, 0);
        ctx.lineTo(r * 0.3, -3);
        ctx.lineTo(r * 0.3, 3);
        ctx.closePath();
        ctx.fill();
        
        // Ok gövdesi
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 0.3, 0);
        ctx.lineTo(-r * 0.3, 0);
        ctx.stroke();
        
        ctx.restore();
        
        // Seviyeye göre süslemeler
        if (this.level >= 2) {
            // Altın süsleme
            ctx.fillStyle = '#FDD835';
            ctx.beginPath();
            ctx.arc(x, y - r * 0.7, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.level >= 3) {
            // Çift ok işareti
            ctx.fillStyle = '#FDD835';
            for (let i = 0; i < 2; i++) {
                const angle = (i / 2) * Math.PI + Math.PI / 4;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * r * 0.6, y + Math.sin(angle) * r * 0.6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Buz Kulesi
    drawFreezeTower(ctx, time) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;
        
        // Atış flash efekti
        if (this.justFired) {
            ctx.fillStyle = `rgba(179, 229, 252, ${this.fireAnimProgress * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Buz aura (dönen)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.5);
        
        const crystalCount = 6;
        for (let i = 0; i < crystalCount; i++) {
            const angle = (i / crystalCount) * Math.PI * 2;
            const pulse = Math.sin(time * 3 + i) * 2;
            const crystalX = Math.cos(angle) * (r + 5 + pulse);
            const crystalY = Math.sin(angle) * (r + 5 + pulse);
            
            ctx.fillStyle = `rgba(179, 229, 252, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(crystalX, crystalY - 4);
            ctx.lineTo(crystalX + 3, crystalY);
            ctx.lineTo(crystalX, crystalY + 4);
            ctx.lineTo(crystalX - 3, crystalY);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        // Taban (buz)
        const baseGradient = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, r);
        baseGradient.addColorStop(0, '#E1F5FE');
        baseGradient.addColorStop(1, '#81D4FA');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(x, y + 2, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Ana kristal
        const crystalGradient = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        crystalGradient.addColorStop(0, this.secondaryColor);
        crystalGradient.addColorStop(0.5, this.color);
        crystalGradient.addColorStop(1, '#01579B');
        ctx.fillStyle = crystalGradient;
        
        // Kristal şekli
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.9);
        ctx.lineTo(x + r * 0.6, y);
        ctx.lineTo(x, y + r * 0.5);
        ctx.lineTo(x - r * 0.6, y);
        ctx.closePath();
        ctx.fill();
        
        // Kristal parlaklık
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.5);
        ctx.lineTo(x + r * 0.1, y - r * 0.3);
        ctx.lineTo(x, y);
        ctx.lineTo(x - r * 0.3, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // İç parıltı
        const innerGlow = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r * 0.5);
        innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.2, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Seviyeye göre
        if (this.level >= 2) {
            // Ekstra kristaller
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + time * 0.3;
                const cx = x + Math.cos(angle) * r * 0.5;
                const cy = y + Math.sin(angle) * r * 0.5;
                
                ctx.fillStyle = '#B3E5FC';
                ctx.beginPath();
                ctx.moveTo(cx, cy - 4);
                ctx.lineTo(cx + 3, cy);
                ctx.lineTo(cx, cy + 4);
                ctx.lineTo(cx - 3, cy);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    // Topçu Kulesi
    drawCannonTower(ctx, time) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;
        
        // Atış efekti (duman ve ateş)
        if (this.justFired) {
            // Ateş
            ctx.fillStyle = `rgba(255, 152, 0, ${this.fireAnimProgress * 0.8})`;
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(this.rotation) * r,
                y + Math.sin(this.rotation) * r,
                r * 0.8 * this.fireAnimProgress,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Duman
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(128, 128, 128, ${this.fireAnimProgress * 0.4 * (1 - i * 0.3)})`;
                ctx.beginPath();
                ctx.arc(
                    x + Math.cos(this.rotation) * (r * 1.2 + i * 8),
                    y + Math.sin(this.rotation) * (r * 1.2 + i * 8),
                    r * 0.3 * (1 + i * 0.3),
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Taban (taş platform)
        const baseGradient = ctx.createLinearGradient(x - r, y, x + r, y);
        baseGradient.addColorStop(0, '#546E7A');
        baseGradient.addColorStop(0.5, '#78909C');
        baseGradient.addColorStop(1, '#455A64');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(x, y + 3, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Taş detayları
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y + 3, r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Top namlusu
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.target ? this.rotation : 0);
        
        // Namlu gövdesi
        const barrelGradient = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
        barrelGradient.addColorStop(0, '#37474F');
        barrelGradient.addColorStop(0.5, this.color);
        barrelGradient.addColorStop(1, '#263238');
        ctx.fillStyle = barrelGradient;
        
        ctx.beginPath();
        ctx.roundRect(0, -r * 0.3, r * 1.2, r * 0.6, 3);
        ctx.fill();
        
        // Namlu ağzı
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(r * 1.1, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Namlu içi (karanlık)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(r * 1.1, 0, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Metal halkalar
        ctx.strokeStyle = '#607D8B';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(r * 0.2 + i * r * 0.3, -r * 0.3);
            ctx.lineTo(r * 0.2 + i * r * 0.3, r * 0.3);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Topçu gövdesi (merkez)
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Civata detayları
        const boltCount = 6;
        for (let i = 0; i < boltCount; i++) {
            const angle = (i / boltCount) * Math.PI * 2;
            ctx.fillStyle = '#90A4AE';
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * r * 0.45,
                y + Math.sin(angle) * r * 0.45,
                2, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Seviyeye göre
        if (this.level >= 2) {
            // Ekstra zırh
            ctx.strokeStyle = '#FDD835';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Büyücü Kulesi
    drawMageTower(ctx, time) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;
        
        // Sihir aura (sürekli dönen)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.8);
        
        // Rune dairesi
        ctx.strokeStyle = `rgba(149, 117, 205, ${0.3 + Math.sin(time * 2) * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Rune sembolleri
        const runeCount = 4;
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const rx = Math.cos(angle) * (r + 5);
            const ry = Math.sin(angle) * (r + 5);
            
            ctx.fillStyle = `rgba(225, 190, 231, ${0.5 + Math.sin(time * 3 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(rx, ry, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Atış efekti
        if (this.justFired) {
            // Sihir patlaması
            ctx.fillStyle = `rgba(225, 190, 231, ${this.fireAnimProgress * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 2 * this.fireAnimProgress, 0, Math.PI * 2);
            ctx.fill();
            
            // Yıldız efekti
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.fireAnimProgress * Math.PI * 2);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.fireAnimProgress})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(angle) * r * 1.5 * this.fireAnimProgress,
                    Math.sin(angle) * r * 1.5 * this.fireAnimProgress
                );
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Taban (sihirli platform)
        const baseGradient = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, r);
        baseGradient.addColorStop(0, '#9575CD');
        baseGradient.addColorStop(1, '#5E35B1');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(x, y + 2, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Ana kule (koni şeklinde)
        const towerGradient = ctx.createLinearGradient(x - r * 0.5, y, x + r * 0.5, y);
        towerGradient.addColorStop(0, '#4A148C');
        towerGradient.addColorStop(0.5, this.color);
        towerGradient.addColorStop(1, '#4A148C');
        ctx.fillStyle = towerGradient;
        
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.8);
        ctx.lineTo(x + r * 0.6, y + r * 0.3);
        ctx.lineTo(x - r * 0.6, y + r * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Kristal top (üstte)
        const crystalGradient = ctx.createRadialGradient(x - 2, y - r * 0.5, 0, x, y - r * 0.3, r * 0.4);
        crystalGradient.addColorStop(0, '#fff');
        crystalGradient.addColorStop(0.3, this.secondaryColor);
        crystalGradient.addColorStop(1, '#7B1FA2');
        ctx.fillStyle = crystalGradient;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Kristal parıltı
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.5, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // İç enerji (nabız efekti)
        const pulseSize = r * 0.2 + Math.sin(time * 4) * r * 0.05;
        const energyGlow = ctx.createRadialGradient(x, y - r * 0.4, 0, x, y - r * 0.4, pulseSize);
        energyGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        energyGlow.addColorStop(1, 'rgba(149, 117, 205, 0)');
        ctx.fillStyle = energyGlow;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Seviyeye göre
        if (this.level >= 2) {
            // Ekstra rune halkası
            ctx.strokeStyle = '#E1BEE7';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        if (this.level >= 3) {
            // Alev aurası
            const flameCount = 5;
            for (let i = 0; i < flameCount; i++) {
                const angle = (i / flameCount) * Math.PI * 2 + time;
                const flameX = x + Math.cos(angle) * r * 0.9;
                const flameY = y + Math.sin(angle) * r * 0.9;
                
                ctx.fillStyle = `rgba(255, 87, 34, ${0.4 + Math.sin(time * 5 + i) * 0.2})`;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Temel kule (fallback)
    drawBasicTower(ctx) {
        const gradient = ctx.createRadialGradient(
            this.position.x - this.radius * 0.3,
            this.position.y - this.radius * 0.3,
            0,
            this.position.x,
            this.position.y,
            this.radius
        );
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Seviye göstergesi
    drawLevelIndicator(ctx) {
        if (this.level > 1) {
            const starCount = this.level - 1;
            const starSize = 5;
            const startX = this.position.x - (starCount - 1) * starSize;
            const starY = this.position.y + this.radius + 8;
            
            for (let i = 0; i < starCount; i++) {
                ctx.fillStyle = '#FDD835';
                ctx.beginPath();
                this.drawStar(ctx, startX + i * starSize * 2, starY, 5, starSize, starSize * 0.5);
                ctx.fill();
            }
        }
    }
    
    // Yıldız çizimi
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
    
    // Hedef çizgisi
    drawTargetLine(ctx) {
        const distance = Math.sqrt(
            Math.pow(this.target.position.x - this.position.x, 2) +
            Math.pow(this.target.position.y - this.position.y, 2)
        );
        const alpha = Math.max(0.2, 1 - (distance / this.range));
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.target.position.x, this.target.position.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Şarj göstergesi
    drawChargeIndicator(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 3;
        const barX = this.position.x - barWidth / 2;
        const barY = this.position.y - this.radius - 8;
        
        // Arka plan
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Şarj barı
        ctx.fillStyle = '#FDD835';
        ctx.fillRect(barX, barY, barWidth * this.chargeProgress, barHeight);
    }
    
    // Renk açıklaştır
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

export default Tower;
