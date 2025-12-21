// Düşman sınıfı - Gelişmiş görsel tasarım
class Enemy {
    constructor(type, path, startIndex = 0) {
        this.type = type;
        this.path = path;
        this.pathIndex = startIndex;
        this.position = path.length > 0 ? { ...path[0] } : { x: 0, y: 0 };
        
        // Tip bazlı özellikler
        const stats = Enemy.getStats(type);
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.armor = stats.armor;
        this.magicResist = stats.magicResist;
        this.reward = stats.reward;
        this.size = stats.size;
        
        // Durum efektleri
        this.slowMultiplier = 1;
        this.frozen = false;
        this.freezeTimer = 0;
        this.stunned = false;
        this.stunTimer = 0;
        this.burning = false;
        this.burnTimer = 0;
        this.burnDamage = 0;
        
        // Görsel
        this.color = stats.color;
        this.secondaryColor = stats.secondaryColor;
        this.radius = stats.radius;
        this.glowColor = stats.glowColor;
        
        // Progress
        this.distanceTraveled = 0;
        this.reachedEnd = false;
        this.rewardCollected = false;
        
        // Animasyon
        this.animTime = Math.random() * Math.PI * 2;
        this.direction = 0; // Hareket yönü açısı
        this.lastPosition = { ...this.position };
        this.hitFlash = 0; // Vurulunca parlaklık
        this.deathAnimation = 0; // Ölüm animasyonu
    }
    
    static getStats(type) {
        const stats = {
            runner: {
                health: 50,
                speed: 2.5,
                armor: 0,
                magicResist: 0,
                reward: 5,
                size: 0.8,
                radius: 18, // Daha büyük
                color: '#FF5722', // Parlak turuncu
                secondaryColor: '#FFCCBC',
                glowColor: 'rgba(255, 87, 34, 0.6)'
            },
            tank: {
                health: 200,
                speed: 0.8,
                armor: 5,
                magicResist: 0,
                reward: 15,
                size: 1.2,
                radius: 26, // Daha büyük
                color: '#3F51B5', // Koyu mavi
                secondaryColor: '#C5CAE9',
                glowColor: 'rgba(63, 81, 181, 0.6)'
            },
            swarm: {
                health: 20,
                speed: 1.8,
                armor: 0,
                magicResist: 0,
                reward: 2,
                size: 0.6,
                radius: 14, // Daha büyük
                color: '#4CAF50', // Parlak yeşil
                secondaryColor: '#C8E6C9',
                glowColor: 'rgba(76, 175, 80, 0.6)'
            },
            miniBoss: {
                health: 500,
                speed: 1,
                armor: 10,
                magicResist: 5,
                reward: 50,
                size: 1.5,
                radius: 30, // Daha büyük
                color: '#9C27B0', // Parlak mor
                secondaryColor: '#E1BEE7',
                glowColor: 'rgba(156, 39, 176, 0.7)'
            },
            boss: {
                health: 1000,
                speed: 0.8,
                armor: 15,
                magicResist: 10,
                reward: 200,
                size: 2,
                radius: 38, // Daha büyük
                color: '#F44336', // Parlak kırmızı
                secondaryColor: '#FFCDD2',
                glowColor: 'rgba(244, 67, 54, 0.8)'
            }
        };
        
        return stats[type] || stats.runner;
    }
    
    // Hasar al
    takeDamage(damage, damageType = 'physical') {
        let finalDamage = damage;
        
        if (damageType === 'physical') {
            finalDamage = Math.max(1, damage - this.armor);
        } else if (damageType === 'magic') {
            finalDamage = Math.max(1, damage - this.magicResist);
        }
        
        this.health -= finalDamage;
        this.hitFlash = 1; // Vurulma efekti
        
        return this.health <= 0;
    }
    
    // Slow uygula
    applySlow(multiplier, duration) {
        if (multiplier < this.slowMultiplier) {
            this.slowMultiplier = multiplier;
        }
    }
    
    // Freeze uygula
    applyFreeze(duration) {
        this.frozen = true;
        this.freezeTimer = Math.max(this.freezeTimer, duration);
    }
    
    // Stun uygula
    applyStun(duration) {
        this.stunned = true;
        this.stunTimer = Math.max(this.stunTimer, duration);
    }
    
    // Yanma uygula
    applyBurn(damage, duration) {
        this.burning = true;
        this.burnDamage = damage;
        this.burnTimer = Math.max(this.burnTimer, duration);
    }
    
    // Güncelle
    update(deltaTime) {
        // Animasyon zamanı
        this.animTime += deltaTime * 0.005;
        
        // Vurulma efekti sönümlemesi
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 0.005;
            if (this.hitFlash < 0) this.hitFlash = 0;
        }
        
        // Durum efektlerini güncelle
        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime;
            if (this.freezeTimer <= 0) {
                this.frozen = false;
            }
        }
        
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
        }
        
        // Yanma hasarı
        if (this.burnTimer > 0) {
            this.burnTimer -= deltaTime;
            if (this.burnTimer > 0 && Math.floor(this.burnTimer / 1000) !== Math.floor((this.burnTimer + deltaTime) / 1000)) {
                this.takeDamage(this.burnDamage, 'magic');
            }
            if (this.burnTimer <= 0) {
                this.burning = false;
                this.burnDamage = 0;
            }
        }
        
        // Eğer frozen veya stunned ise hareket etme
        if (this.frozen || this.stunned) {
            return;
        }
        
        // Önceki pozisyonu kaydet (yön hesabı için)
        this.lastPosition = { ...this.position };
        
        // Yolda ilerle
        if (this.pathIndex < this.path.length - 1) {
            const current = this.path[this.pathIndex];
            const next = this.path[this.pathIndex + 1];
            
            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Yön açısını hesapla
            this.direction = Math.atan2(dy, dx);
            
            const moveDistance = this.speed * this.slowMultiplier * deltaTime * 0.1;
            const progress = moveDistance / distance;
            
            if (progress >= 1) {
                this.pathIndex++;
                this.position = { ...next };
                this.distanceTraveled += distance;
            } else {
                this.position.x = current.x + dx * progress;
                this.position.y = current.y + dy * progress;
                this.distanceTraveled += moveDistance;
            }
        } else {
            this.reachedEnd = true;
        }
    }
    
    // Çiz
    draw(ctx) {
        const alpha = this.frozen ? 0.7 : 1;
        const time = this.animTime;
        
        // Yürüme animasyonu
        const walkBob = Math.sin(time * 8) * 2;
        const walkSway = Math.sin(time * 8) * 1;
        
        const bodyX = this.position.x + walkSway;
        const bodyY = this.position.y + walkBob * 0.5;
        
        // Vurulma flash efekti
        const flashIntensity = this.hitFlash;
        
        // DIŞ GLOW EFEKTİ - Düşmanları daha görünür yapar
        this.drawOuterGlow(ctx, bodyX, bodyY);
        
        // Gölge
        this.drawShadow(ctx, bodyX, bodyY);
        
        // Yön göstergesi (hareket oku)
        this.drawDirectionIndicator(ctx, bodyX, bodyY);
        
        // Düşman tipine göre çizim
        switch (this.type) {
            case 'runner':
                this.drawRunner(ctx, bodyX, bodyY, time, alpha, flashIntensity);
                break;
            case 'tank':
                this.drawTank(ctx, bodyX, bodyY, time, alpha, flashIntensity);
                break;
            case 'swarm':
                this.drawSwarm(ctx, bodyX, bodyY, time, alpha, flashIntensity);
                break;
            case 'miniBoss':
                this.drawMiniBoss(ctx, bodyX, bodyY, time, alpha, flashIntensity);
                break;
            case 'boss':
                this.drawBoss(ctx, bodyX, bodyY, time, alpha, flashIntensity);
                break;
            default:
                this.drawBasicEnemy(ctx, bodyX, bodyY, alpha);
        }
        
        // Can çubuğu
        this.drawHealthBar(ctx);
        
        // Durum efektleri
        this.drawStatusEffects(ctx, time);
    }
    
    // Dış ışıma efekti - Düşmanları daha görünür yapar
    drawOuterGlow(ctx, x, y) {
        const glowSize = this.radius * 2;
        const glowGradient = ctx.createRadialGradient(x, y, this.radius * 0.5, x, y, glowSize);
        glowGradient.addColorStop(0, this.glowColor || 'rgba(255, 255, 255, 0.3)');
        glowGradient.addColorStop(0.5, this.glowColor ? this.glowColor.replace(/[\d.]+\)$/, '0.3)') : 'rgba(255, 255, 255, 0.15)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // İç halka - daha belirgin kenar
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, this.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    // Hareket yönü göstergesi
    drawDirectionIndicator(ctx, x, y) {
        if (this.frozen || this.stunned) return;
        
        const arrowLength = this.radius * 0.8;
        const arrowX = x + Math.cos(this.direction) * (this.radius + 8);
        const arrowY = y + Math.sin(this.direction) * (this.radius + 8);
        
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(this.direction);
        
        // Yarı saydam ok
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(arrowLength * 0.5, 0);
        ctx.lineTo(-arrowLength * 0.3, -arrowLength * 0.3);
        ctx.lineTo(-arrowLength * 0.1, 0);
        ctx.lineTo(-arrowLength * 0.3, arrowLength * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // Gölge
    drawShadow(ctx, x, y) {
        const shadowGradient = ctx.createRadialGradient(
            x, y + this.radius * 0.8, 0,
            x, y + this.radius * 0.8, this.radius * 1.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + this.radius * 0.8, this.radius * 1.1, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Runner (hızlı, ince) - Daha görünür
    drawRunner(ctx, x, y, time, alpha, flash) {
        ctx.globalAlpha = alpha;
        const r = this.radius;
        
        // Flash efekti
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Hız çizgileri (arkada) - Daha belirgin
        ctx.strokeStyle = `rgba(255, 87, 34, 0.6)`;
        ctx.lineWidth = 3;
        const trailDir = this.direction + Math.PI;
        for (let i = 0; i < 4; i++) {
            const offsetY = (i - 1.5) * 6;
            const startX = x + Math.cos(trailDir) * (r + i * 6);
            const startY = y + Math.sin(trailDir) * (r + i * 6) + offsetY;
            ctx.globalAlpha = 0.6 - i * 0.15;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + Math.cos(trailDir) * (15 + i * 5), startY + Math.sin(trailDir) * (15 + i * 5));
            ctx.stroke();
        }
        ctx.globalAlpha = alpha;
        
        // Bacaklar (animasyonlu) - Daha kalın
        ctx.strokeStyle = '#E64A19';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const legAngle = Math.sin(time * 12) * 0.5;
        
        // Sol bacak
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.3);
        ctx.lineTo(x - r * 0.5 + Math.sin(legAngle) * 8, y + r);
        ctx.stroke();
        
        // Sağ bacak
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y + r * 0.3);
        ctx.lineTo(x + r * 0.5 - Math.sin(legAngle) * 8, y + r);
        ctx.stroke();
        
        // Gövde (oval, yöne doğru uzanmış)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.direction);
        
        // Dış kenar
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.8, r * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        const bodyGradient = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        bodyGradient.addColorStop(0, '#FFCCBC');
        bodyGradient.addColorStop(0.5, this.color);
        bodyGradient.addColorStop(1, '#E64A19');
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.75, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Sivri uç (hız göstergesi) - Daha belirgin
        ctx.fillStyle = '#FF5722';
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 0.9, 0);
        ctx.lineTo(r * 0.5, -r * 0.4);
        ctx.lineTo(r * 0.5, r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // Gözler - Daha büyük
        this.drawEyes(ctx, x, y, r * 0.7);
        
        ctx.globalAlpha = 1;
    }
    
    // Tank (büyük, zırhlı) - Daha görünür
    drawTank(ctx, x, y, time, alpha, flash) {
        ctx.globalAlpha = alpha;
        const r = this.radius;
        
        // Flash efekti
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dış zırh halkası - Dönen
        ctx.strokeStyle = '#5C6BC0';
        ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
            const ringAngle = time * 0.3 + (i * Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.arc(x, y, r * 0.95, ringAngle, ringAngle + Math.PI * 0.4);
            ctx.stroke();
        }
        
        // Zırh parçaları (dış) - Daha büyük
        const armorCount = 6;
        for (let i = 0; i < armorCount; i++) {
            const angle = (i / armorCount) * Math.PI * 2 + time * 0.15;
            const ax = x + Math.cos(angle) * r * 0.85;
            const ay = y + Math.sin(angle) * r * 0.85;
            
            // Zırh parçası gradient
            const armorGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, r * 0.25);
            armorGrad.addColorStop(0, '#7986CB');
            armorGrad.addColorStop(1, '#3F51B5');
            ctx.fillStyle = armorGrad;
            
            ctx.beginPath();
            ctx.arc(ax, ay, r * 0.22, 0, Math.PI * 2);
            ctx.fill();
            
            // Parça kenarlığı
            ctx.strokeStyle = '#1A237E';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Ana gövde - Daha parlak
        const bodyGradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        bodyGradient.addColorStop(0, '#E8EAF6');
        bodyGradient.addColorStop(0.4, '#9FA8DA');
        bodyGradient.addColorStop(0.7, this.color);
        bodyGradient.addColorStop(1, '#283593');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
        ctx.fill();
        
        // Zırh kenarı - Daha kalın
        ctx.strokeStyle = '#1A237E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        
        // Zırh detayları (çapraz çizgiler) - Daha belirgin
        ctx.strokeStyle = '#C5CAE9';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * r * 0.25, y + Math.sin(angle) * r * 0.25);
            ctx.lineTo(x + Math.cos(angle) * r * 0.55, y + Math.sin(angle) * r * 0.55);
            ctx.stroke();
        }
        
        // Merkez koruma - Daha büyük
        const centerGrad = ctx.createRadialGradient(x, y - r * 0.1, 0, x, y, r * 0.4);
        centerGrad.addColorStop(0, '#3F51B5');
        centerGrad.addColorStop(1, '#1A237E');
        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#C5CAE9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gözler (kızgın bakış) - Daha parlak
        ctx.fillStyle = '#FF1744';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x - r * 0.18, y - r * 0.1, r * 0.14, 0, Math.PI * 2);
        ctx.arc(x + r * 0.18, y - r * 0.1, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Göz parlaklığı
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.15, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.14, y - r * 0.15, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
    
    // Swarm (küçük, kalabalık) - Daha görünür
    drawSwarm(ctx, x, y, time, alpha, flash) {
        ctx.globalAlpha = alpha;
        const r = this.radius;
        
        // Flash efekti
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Kanatlar (titreşen) - Daha parlak
        const wingFlap = Math.sin(time * 25) * 0.4;
        
        // Kanat glow
        ctx.fillStyle = 'rgba(165, 214, 167, 0.8)';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 1;
        
        // Sol kanat
        ctx.beginPath();
        ctx.ellipse(x - r * 0.6, y - r * 0.3, r * 0.5, r * 0.25, -wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Sağ kanat
        ctx.beginPath();
        ctx.ellipse(x + r * 0.6, y - r * 0.3, r * 0.5, r * 0.25, wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gövde - Daha parlak
        const bodyGradient = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
        bodyGradient.addColorStop(0, '#E8F5E9');
        bodyGradient.addColorStop(0.5, '#81C784');
        bodyGradient.addColorStop(0.8, this.color);
        bodyGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = bodyGradient;
        
        // Böcek şekli (3 segment) - Daha belirgin
        ctx.beginPath();
        ctx.arc(x, y - r * 0.35, r * 0.3, 0, Math.PI * 2); // Kafa
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + r * 0.05, r * 0.4, 0, Math.PI * 2); // Göğüs
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5, r * 0.35, 0, Math.PI * 2); // Karın
        ctx.fill();
        
        // Segment kenarları
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + r * 0.05, r * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5, r * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        
        // Antenler - Daha kalın
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.6);
        ctx.quadraticCurveTo(x - r * 0.4, y - r * 1, x - r * 0.5, y - r * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.6);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 1, x + r * 0.5, y - r * 0.7);
        ctx.stroke();
        
        // Anten uçları
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(x - r * 0.5, y - r * 0.7, r * 0.1, 0, Math.PI * 2);
        ctx.arc(x + r * 0.5, y - r * 0.7, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Gözler - Daha büyük ve parlak
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.4, r * 0.12, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.4, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Göz parlaklığı
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.18, y - r * 0.43, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.12, y - r * 0.43, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
    
    // Mini-Boss - Daha görünür
    drawMiniBoss(ctx, x, y, time, alpha, flash) {
        ctx.globalAlpha = alpha;
        const r = this.radius;
        
        // Çoklu aura efekti - Çok daha belirgin
        for (let i = 0; i < 3; i++) {
            const auraSize = r + 15 + i * 10 + Math.sin(time * 2 + i) * 5;
            const auraGradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, auraSize);
            auraGradient.addColorStop(0, 'rgba(156, 39, 176, 0)');
            auraGradient.addColorStop(0.6, `rgba(156, 39, 176, ${0.3 - i * 0.08})`);
            auraGradient.addColorStop(1, 'rgba(156, 39, 176, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(x, y, auraSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Flash efekti
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Boynuzlar - Daha büyük ve parlak
        const hornGrad = ctx.createLinearGradient(x, y - r * 1.5, x, y - r * 0.3);
        hornGrad.addColorStop(0, '#E1BEE7');
        hornGrad.addColorStop(0.5, '#9C27B0');
        hornGrad.addColorStop(1, '#4A148C');
        ctx.fillStyle = hornGrad;
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 2;
        
        // Sol boynuz
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.5);
        ctx.quadraticCurveTo(x - r * 0.9, y - r * 1.5, x - r * 0.5, y - r * 1.1);
        ctx.quadraticCurveTo(x - r * 0.25, y - r * 0.8, x - r * 0.35, y - r * 0.5);
        ctx.fill();
        ctx.stroke();
        
        // Sağ boynuz
        ctx.beginPath();
        ctx.moveTo(x + r * 0.35, y - r * 0.5);
        ctx.quadraticCurveTo(x + r * 0.9, y - r * 1.5, x + r * 0.5, y - r * 1.1);
        ctx.quadraticCurveTo(x + r * 0.25, y - r * 0.8, x + r * 0.35, y - r * 0.5);
        ctx.fill();
        ctx.stroke();
        
        // Gövde - Daha parlak gradient
        const bodyGradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        bodyGradient.addColorStop(0, '#F3E5F5');
        bodyGradient.addColorStop(0.3, this.secondaryColor);
        bodyGradient.addColorStop(0.6, this.color);
        bodyGradient.addColorStop(1, '#4A148C');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        
        // Gövde kenarı
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        
        // Yüz detayları - Daha belirgin
        const faceGrad = ctx.createRadialGradient(x, y - r * 0.15, 0, x, y - r * 0.1, r * 0.6);
        faceGrad.addColorStop(0, '#F8BBD9');
        faceGrad.addColorStop(1, '#E1BEE7');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.05, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        // Kızgın gözler - Işıyan
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.arc(x + r * 0.22, y - r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Göz pupilleri
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.2, r * 0.07, 0, Math.PI * 2);
        ctx.arc(x + r * 0.22, y - r * 0.2, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        
        // Göz parlaklığı
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.28, y - r * 0.26, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.16, y - r * 0.26, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // Sinsi gülümseme - Dişler
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.25, r * 0.3, 0.3, Math.PI - 0.3);
        ctx.stroke();
        
        // Dişler
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
            const toothX = x - r * 0.2 + i * r * 0.13;
            ctx.beginPath();
            ctx.moveTo(toothX, y + r * 0.15);
            ctx.lineTo(toothX + r * 0.06, y + r * 0.15);
            ctx.lineTo(toothX + r * 0.03, y + r * 0.28);
            ctx.closePath();
            ctx.fill();
        }
        
        // MINI-BOSS etiketi
        ctx.fillStyle = '#E040FB';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('MINI-BOSS', x, y - r - 8);
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 1;
    }
    
    // Boss - Daha görünür ve etkileyici
    drawBoss(ctx, x, y, time, alpha, flash) {
        ctx.globalAlpha = alpha;
        const r = this.radius;
        
        // Çok güçlü pulsing aura
        const auraLayers = 5;
        for (let i = 0; i < auraLayers; i++) {
            const auraSize = r + 25 + i * 12 + Math.sin(time * 2.5 + i * 0.5) * 8;
            const auraAlpha = 0.25 - i * 0.04;
            const auraGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, auraSize);
            auraGrad.addColorStop(0, `rgba(244, 67, 54, 0)`);
            auraGrad.addColorStop(0.6, `rgba(244, 67, 54, ${auraAlpha})`);
            auraGrad.addColorStop(1, 'rgba(244, 67, 54, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(x, y, auraSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dönen enerji halkası
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
            const ringAngle = time * 0.5 + (i * Math.PI / 2);
            ctx.beginPath();
            ctx.arc(x, y, r + 8, ringAngle, ringAngle + Math.PI * 0.3);
            ctx.stroke();
        }
        
        // Flash efekti
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Taç/Boynuzlar - Daha büyük ve altın
        const crownGrad = ctx.createLinearGradient(x, y - r * 1.5, x, y - r * 0.3);
        crownGrad.addColorStop(0, '#FFF59D');
        crownGrad.addColorStop(0.5, '#FFD700');
        crownGrad.addColorStop(1, '#FF8F00');
        ctx.fillStyle = crownGrad;
        ctx.strokeStyle = '#FF6F00';
        ctx.lineWidth = 2;
        
        const spikeCount = 7;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / (spikeCount - 1)) * Math.PI - Math.PI;
            const spikeX = x + Math.cos(angle) * r * 0.7;
            const spikeY = y + Math.sin(angle) * r * 0.5 - r * 0.3;
            const spikeHeight = (i === 3) ? r * 0.8 : r * 0.5 + Math.abs(i - 3) * r * 0.08;
            
            ctx.beginPath();
            ctx.moveTo(spikeX - r * 0.08, spikeY);
            ctx.lineTo(spikeX, spikeY - spikeHeight);
            ctx.lineTo(spikeX + r * 0.08, spikeY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Ana gövde - Çok parlak
        const bodyGradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        bodyGradient.addColorStop(0, '#FFEBEE');
        bodyGradient.addColorStop(0.3, '#FFCDD2');
        bodyGradient.addColorStop(0.6, this.color);
        bodyGradient.addColorStop(1, '#B71C1C');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Zırh halkası - Çift katman
        ctx.strokeStyle = '#880E4F';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
        ctx.stroke();
        
        // İç halka deseni
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * r * 0.5, y + Math.sin(angle) * r * 0.5);
            ctx.lineTo(x + Math.cos(angle) * r * 0.7, y + Math.sin(angle) * r * 0.7);
            ctx.stroke();
        }
        
        // Yüz - Daha detaylı
        const faceGrad = ctx.createRadialGradient(x, y - r * 0.1, 0, x, y, r * 0.6);
        faceGrad.addColorStop(0, '#FFF8E1');
        faceGrad.addColorStop(1, '#FFCDD2');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        // Gözler (yoğun ışıyan)
        ctx.shadowColor = '#FF5722';
        ctx.shadowBlur = 20;
        
        const eyeGlow = ctx.createRadialGradient(x - r * 0.22, y - r * 0.12, 0, x - r * 0.22, y - r * 0.12, r * 0.22);
        eyeGlow.addColorStop(0, '#FFFFFF');
        eyeGlow.addColorStop(0.3, '#FFEB3B');
        eyeGlow.addColorStop(0.6, '#FF5722');
        eyeGlow.addColorStop(1, '#D32F2F');
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.12, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeGlow2 = ctx.createRadialGradient(x + r * 0.22, y - r * 0.12, 0, x + r * 0.22, y - r * 0.12, r * 0.22);
        eyeGlow2.addColorStop(0, '#FFFFFF');
        eyeGlow2.addColorStop(0.3, '#FFEB3B');
        eyeGlow2.addColorStop(0.6, '#FF5722');
        eyeGlow2.addColorStop(1, '#D32F2F');
        ctx.fillStyle = eyeGlow2;
        ctx.beginPath();
        ctx.arc(x + r * 0.22, y - r * 0.12, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Göz pupilleri
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.12, r * 0.06, 0, Math.PI * 2);
        ctx.arc(x + r * 0.22, y - r * 0.12, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        // Sinsi gülümseme - Daha belirgin
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.2, r * 0.3, 0.3, Math.PI - 0.3);
        ctx.stroke();
        
        // Dişler
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 6; i++) {
            const toothX = x - r * 0.25 + i * r * 0.1;
            ctx.beginPath();
            ctx.moveTo(toothX, y + r * 0.12);
            ctx.lineTo(toothX + r * 0.05, y + r * 0.12);
            ctx.lineTo(toothX + r * 0.025, y + r * 0.25);
            ctx.closePath();
            ctx.fill();
        }
        
        // BOSS etiketi - Daha belirgin
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#B71C1C';
        ctx.shadowBlur = 8;
        ctx.fillText('⚔ BOSS ⚔', x, y - r - 12);
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 1;
    }
    
    // Temel düşman (fallback)
    drawBasicEnemy(ctx, x, y, alpha) {
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createRadialGradient(x - this.radius * 0.3, y - this.radius * 0.3, 0, x, y, this.radius);
        gradient.addColorStop(0, this.secondaryColor || this.lightenColor(this.color, 30));
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawEyes(ctx, x, y, this.radius);
        
        ctx.globalAlpha = 1;
    }
    
    // Gözler
    drawEyes(ctx, x, y, size) {
        // Beyaz kısım
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Göz bebeği (hedefe doğru bakıyor olabilir)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.1, size * 0.07, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.1, size * 0.07, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Can çubuğu - Daha büyük ve görünür
    drawHealthBar(ctx) {
        const barWidth = this.radius * 3; // Daha geniş
        const barHeight = 8; // Daha yüksek
        const barX = this.position.x - barWidth / 2;
        const barY = this.position.y - this.radius - 18;
        
        // Dış çerçeve (glow)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        
        // Arka plan
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Kenar çizgisi
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
        ctx.stroke();
        
        // Can barı
        const healthPercent = this.health / this.maxHealth;
        
        let barColor;
        if (healthPercent > 0.6) {
            barColor = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            barColor.addColorStop(0, '#81C784');
            barColor.addColorStop(0.5, '#4CAF50');
            barColor.addColorStop(1, '#388E3C');
        } else if (healthPercent > 0.3) {
            barColor = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            barColor.addColorStop(0, '#FFB74D');
            barColor.addColorStop(0.5, '#FF9800');
            barColor.addColorStop(1, '#F57C00');
        } else {
            barColor = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            barColor.addColorStop(0, '#EF5350');
            barColor.addColorStop(0.5, '#F44336');
            barColor.addColorStop(1, '#D32F2F');
        }
        
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * healthPercent, barHeight, 3);
        ctx.fill();
        
        // Parlaklık efekti
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.roundRect(barX + 1, barY + 1, barWidth * healthPercent - 2, barHeight * 0.4, [2, 2, 0, 0]);
        ctx.fill();
        
        // Can değeri metni (boss ve miniboss için)
        if (this.type === 'boss' || this.type === 'miniBoss') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, this.position.x, barY + barHeight / 2);
        }
    }
    
    // Durum efektleri - Daha görünür
    drawStatusEffects(ctx, time) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;
        
        // Frozen efekti - Daha belirgin
        if (this.frozen) {
            // Buz aurası
            const iceGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r + 15);
            iceGrad.addColorStop(0, 'rgba(79, 195, 247, 0)');
            iceGrad.addColorStop(0.7, 'rgba(79, 195, 247, 0.4)');
            iceGrad.addColorStop(1, 'rgba(79, 195, 247, 0)');
            ctx.fillStyle = iceGrad;
            ctx.beginPath();
            ctx.arc(x, y, r + 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Buz kristalleri halkası
            ctx.strokeStyle = '#4FC3F7';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Kristal parçacıkları - Daha büyük
            const crystalCount = 10;
            for (let i = 0; i < crystalCount; i++) {
                const angle = (i / crystalCount) * Math.PI * 2 + time * 0.5;
                const cx = x + Math.cos(angle) * (r + 10);
                const cy = y + Math.sin(angle) * (r + 10);
                
                ctx.fillStyle = '#E1F5FE';
                ctx.strokeStyle = '#03A9F4';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 6);
                ctx.lineTo(cx + 4, cy);
                ctx.lineTo(cx, cy + 6);
                ctx.lineTo(cx - 4, cy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            
            // "FROZEN" text
            ctx.fillStyle = '#4FC3F7';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('❄ FROZEN ❄', x, y + r + 20);
        }
        
        // Stun efekti - Daha belirgin
        if (this.stunned) {
            // Stun aurası
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            ctx.arc(x, y, r + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Dönen yıldızlar - Daha büyük
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            
            const starCount = 4;
            for (let i = 0; i < starCount; i++) {
                const angle = (i / starCount) * Math.PI * 2 + time * 4;
                const sx = x + Math.cos(angle) * (r + 12);
                const sy = y - r * 0.3 + Math.sin(time * 6 + i) * 4;
                ctx.fillText('⭐', sx, sy);
            }
            
            // "STUNNED" text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('💫 STUNNED', x, y + r + 20);
        }
        
        // Burning efekti - Daha belirgin
        if (this.burning) {
            // Yanma aurası
            const fireGrad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r + 12);
            fireGrad.addColorStop(0, 'rgba(255, 87, 34, 0)');
            fireGrad.addColorStop(0.7, 'rgba(255, 87, 34, 0.3)');
            fireGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.arc(x, y, r + 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Alevler - Daha büyük
            const flameCount = 8;
            for (let i = 0; i < flameCount; i++) {
                const angle = (i / flameCount) * Math.PI * 2 + time * 3;
                const fx = x + Math.cos(angle) * r * 0.8;
                const fy = y + Math.sin(angle) * r * 0.8;
                const flameHeight = 12 + Math.sin(time * 12 + i) * 5;
                
                // Alev gradient
                const flameGradient = ctx.createLinearGradient(fx, fy + 5, fx, fy - flameHeight);
                flameGradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
                flameGradient.addColorStop(0.4, 'rgba(255, 152, 0, 0.7)');
                flameGradient.addColorStop(0.7, 'rgba(244, 67, 54, 0.5)');
                flameGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
                
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.ellipse(fx, fy - flameHeight / 2, 5, flameHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // "BURNING" text
            ctx.fillStyle = '#FF5722';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔥 BURNING', x, y + r + 20);
        }
        
        // Slow efekti - Daha belirgin
        if (this.slowMultiplier < 1 && !this.frozen) {
            // Slow aurası
            const slowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r + 10);
            slowGrad.addColorStop(0, 'rgba(79, 195, 247, 0)');
            slowGrad.addColorStop(0.7, 'rgba(79, 195, 247, 0.25)');
            slowGrad.addColorStop(1, 'rgba(79, 195, 247, 0)');
            ctx.fillStyle = slowGrad;
            ctx.beginPath();
            ctx.arc(x, y, r + 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(79, 195, 247, 0.7)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(x, y, r + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Slow göstergesi
            ctx.fillStyle = '#4FC3F7';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            const slowPercent = Math.round((1 - this.slowMultiplier) * 100);
            ctx.fillText(`🐌 -${slowPercent}%`, x, y + r + 18);
        }
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
    
    // Düşman ikonu
    getEnemyIcon() {
        const icons = {
            runner: '👤',
            tank: '🛡',
            swarm: '🐛',
            miniBoss: '👹',
            boss: '👾'
        };
        return icons[this.type] || '👤';
    }
    
    // Öldü mü?
    isDead() {
        return this.health <= 0;
    }
}

export default Enemy;
