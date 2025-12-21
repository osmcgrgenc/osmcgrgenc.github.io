// Boss sınıfı (Enemy'den türetilmiş)
import Enemy from './Enemy.js';

class Boss extends Enemy {
    constructor(path, startIndex = 0) {
        super('boss', path, startIndex);
        
        // Boss özel özellikler
        this.maxHealth = 1000;
        this.health = 1000;
        this.armor = 15;
        this.magicResist = 10;
        this.reward = 200;
        this.radius = 20;
        this.color = '#e74c3c';
        
        // Faz sistemi
        this.phase = 1;
        this.maxPhases = 3;
        this.phaseHealthThreshold = this.maxHealth / this.maxPhases;
        
        // Özel yetenekler
        this.shieldActive = false;
        this.shieldHealth = 0;
        this.maxShieldHealth = 200;
        this.summonTimer = 0;
        this.summonCooldown = 10000; // 10 saniye
        this.rageMode = false;
        this.rageThreshold = 0.3; // %30 can kaldığında
        
        // Summon edilecek düşmanlar
        this.summonedEnemies = [];
    }
    
    // Faz değiştir
    checkPhaseChange() {
        const healthPercent = this.health / this.maxHealth;
        const newPhase = Math.ceil((1 - healthPercent) * this.maxPhases) + 1;
        
        if (newPhase > this.phase && newPhase <= this.maxPhases) {
            this.phase = newPhase;
            this.onPhaseChange();
            return true;
        }
        
        return false;
    }
    
    // Faz değiştiğinde
    onPhaseChange() {
        // Her fazda daha güçlü olur
        this.speed *= 1.2;
        this.armor += 2;
        this.magicResist += 2;
        
        // Faz 2: Kalkan aktif
        if (this.phase === 2) {
            this.shieldActive = true;
            this.shieldHealth = this.maxShieldHealth;
        }
        
        // Faz 3: Rage mode
        if (this.phase === 3) {
            this.rageMode = true;
            this.speed *= 1.5;
        }
    }
    
    // Hasar al (kalkan kontrolü ile)
    takeDamage(damage, damageType = 'physical') {
        // Kalkan aktifse önce kalkana hasar
        if (this.shieldActive && this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            if (this.shieldHealth <= 0) {
                this.shieldActive = false;
                this.shieldHealth = 0;
            }
            return false; // Kalkan varken cana hasar gitmez
        }
        
        // Normal hasar
        return super.takeDamage(damage, damageType);
    }
    
    // Summon (düşman çağırma)
    canSummon(currentTime) {
        return (currentTime - this.summonTimer) >= this.summonCooldown;
    }
    
    summonEnemies(path) {
        this.summonTimer = performance.now();
        
        // Faz 1: 2 runner
        // Faz 2: 1 tank + 2 swarm
        // Faz 3: 2 tank + 3 swarm
        
        const summoned = [];
        
        if (this.phase === 1) {
            for (let i = 0; i < 2; i++) {
                summoned.push({
                    type: 'runner',
                    path: path,
                    startIndex: this.pathIndex // Boss'un bulunduğu noktadan başla
                });
            }
        } else if (this.phase === 2) {
            summoned.push({
                type: 'tank',
                path: path,
                startIndex: this.pathIndex
            });
            for (let i = 0; i < 2; i++) {
                summoned.push({
                    type: 'swarm',
                    path: path,
                    startIndex: this.pathIndex
                });
            }
        } else if (this.phase === 3) {
            for (let i = 0; i < 2; i++) {
                summoned.push({
                    type: 'tank',
                    path: path,
                    startIndex: this.pathIndex
                });
            }
            for (let i = 0; i < 3; i++) {
                summoned.push({
                    type: 'swarm',
                    path: path,
                    startIndex: this.pathIndex
                });
            }
        }
        
        return summoned;
    }
    
    // Güncelle
    update(deltaTime) {
        // Faz kontrolü
        this.checkPhaseChange();
        
        // Rage mode kontrolü
        if (!this.rageMode && (this.health / this.maxHealth) <= this.rageThreshold) {
            this.rageMode = true;
            this.speed *= 1.5;
        }
        
        // Normal enemy update
        super.update(deltaTime);
    }
    
    // Çiz
    draw(ctx) {
        const time = Date.now() * 0.001;
        
        // Kalkan gösterimi (daha belirgin)
        if (this.shieldActive && this.shieldHealth > 0) {
            const shieldRadius = this.radius + 6;
            const pulse = Math.sin(time * 3) * 2;
            
            // Kalkan dış halka (pulse efekti)
            ctx.strokeStyle = `rgba(52, 152, 219, ${0.6 + pulse * 0.2})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, shieldRadius + pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            // Kalkan gradient
            const shieldGradient = ctx.createRadialGradient(
                this.position.x, this.position.y,
                0,
                this.position.x, this.position.y,
                shieldRadius
            );
            shieldGradient.addColorStop(0, 'rgba(52, 152, 219, 0.5)');
            shieldGradient.addColorStop(0.7, 'rgba(52, 152, 219, 0.3)');
            shieldGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, shieldRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Kalkan can çubuğu
            const shieldPercent = this.shieldHealth / this.maxShieldHealth;
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, shieldRadius, 0, Math.PI * 2 * shieldPercent);
            ctx.fill();
            
            // Kalkan ikonu
            ctx.fillStyle = '#3498db';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🛡', this.position.x, this.position.y - this.radius - 20);
        }
        
        // Rage mode gösterimi (daha belirgin)
        if (this.rageMode) {
            const ragePulse = Math.sin(time * 5) * 3;
            ctx.strokeStyle = `rgba(231, 76, 60, ${0.8 + Math.sin(time * 10) * 0.2})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 10 + ragePulse, 0, Math.PI * 2);
            ctx.stroke();
            
            // Rage partikülleri
            ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + time;
                const x = this.position.x + Math.cos(angle) * (this.radius + 12);
                const y = this.position.y + Math.sin(angle) * (this.radius + 12);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Normal çizim
        super.draw(ctx);
        
        // Faz göstergesi (daha belirgin)
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(`Faz ${this.phase}`, this.position.x, this.position.y - this.radius - 18);
        ctx.fillText(`Faz ${this.phase}`, this.position.x, this.position.y - this.radius - 18);
        
        // Boss etiketi (daha belirgin)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 14px Arial';
        ctx.strokeText('BOSS', this.position.x, this.position.y + 5);
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('BOSS', this.position.x, this.position.y + 5);
    }
}

export default Boss;

