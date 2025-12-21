// Mermi sınıfı - Gelişmiş görsel tasarım
class ProjectilePool {
    constructor() {
        this.pool = [];
        this.active = [];
        this.maxActive = 100;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 768);
        
        if (this.isMobile) {
            this.maxActive = 50;
        }
    }
    
    create(x, y, target, damage, damageType, speed, color, tower) {
        if (this.active.length >= this.maxActive) {
            const oldest = this.active.shift();
            if (oldest) this.remove(oldest);
        }
        
        let projectile = this.pool.pop();
        
        if (!projectile) {
            projectile = {
                x: 0, y: 0, target: null, damage: 0,
                damageType: 'physical', speed: 0, radius: 8,
                color: '#fff', tower: null, isCrit: false,
                active: false, trail: [], type: 'arrow'
            };
        }
        
        projectile.x = x;
        projectile.y = y;
        projectile.startX = x;
        projectile.startY = y;
        projectile.target = target;
        projectile.damage = damage;
        projectile.damageType = damageType;
        projectile.speed = speed;
        projectile.color = color;
        projectile.tower = tower;
        projectile.isCrit = false;
        projectile.active = true;
        projectile.trail = [];
        projectile.rotation = 0;
        projectile.life = 0;
        projectile.type = tower ? tower.type : 'arrow';
        
        this.active.push(projectile);
        return projectile;
    }
    
    update(projectile, deltaTime) {
        if (!projectile.active || !projectile.target || projectile.target.isDead()) {
            this.remove(projectile);
            return false;
        }
        
        projectile.life += deltaTime;
        
        // Trail kaydet
        if (projectile.trail.length < 8) {
            projectile.trail.push({ x: projectile.x, y: projectile.y, alpha: 1 });
        } else {
            projectile.trail.shift();
            projectile.trail.push({ x: projectile.x, y: projectile.y, alpha: 1 });
        }
        
        // Trail alpha azalt
        for (let i = 0; i < projectile.trail.length; i++) {
            projectile.trail[i].alpha = (i + 1) / projectile.trail.length * 0.6;
        }
        
        const dx = projectile.target.position.x - projectile.x;
        const dy = projectile.target.position.y - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        projectile.rotation = Math.atan2(dy, dx);
        
        if (distance < projectile.target.radius) {
            this.hit(projectile);
            return false;
        }
        
        const moveDistance = projectile.speed * deltaTime * 0.1;
        projectile.x += (dx / distance) * moveDistance;
        projectile.y += (dy / distance) * moveDistance;
        
        return true;
    }
    
    hit(projectile) {
        const tower = projectile.tower;
        const enemy = projectile.target;
        
        let finalDamage = projectile.damage;
        
        if (tower && tower.armorPenetration > 0) {
            finalDamage += tower.armorPenetration;
        }
        
        const killed = enemy.takeDamage(finalDamage, projectile.damageType);
        
        if (tower) {
            if (tower.canSlow && !enemy.frozen) enemy.applySlow(0.5, 2000);
            if (tower.canFreeze) enemy.applyFreeze(3000);
            if (tower.canStun && Math.random() < 0.3) enemy.applyStun(1000);
            if (tower.canBurn) enemy.applyBurn(tower.burnDamage, tower.burnDuration);
        }
        
        if (tower && tower.magicResistPenetration > 0 && projectile.damageType === 'magic') {
            finalDamage += tower.magicResistPenetration;
        }
        
        this.remove(projectile);
        return { killed, enemy, damage: finalDamage, position: { x: enemy.position.x, y: enemy.position.y }, tower };
    }
    
    remove(projectile) {
        projectile.active = false;
        projectile.trail = [];
        const index = this.active.indexOf(projectile);
        if (index > -1) this.active.splice(index, 1);
        this.pool.push(projectile);
    }
    
    updateAll(deltaTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            this.update(this.active[i], deltaTime);
        }
    }
    
    draw(ctx) {
        for (const p of this.active) {
            switch (p.type) {
                case 'archer': this.drawArrow(ctx, p); break;
                case 'freeze': this.drawIceShard(ctx, p); break;
                case 'cannon': this.drawCannonball(ctx, p); break;
                case 'mage': this.drawMagicOrb(ctx, p); break;
                default: this.drawBasicProjectile(ctx, p);
            }
        }
    }
    
    drawArrow(ctx, p) {
        // Trail
        this.drawTrail(ctx, p, '#8D6E63');
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Ok gövdesi
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        
        // Ok ucu
        ctx.fillStyle = p.isCrit ? '#FFD700' : '#FDD835';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(6, 0);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        
        // Tüyler
        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-10, -4);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        if (p.isCrit) this.drawCritGlow(ctx, p, '#FFD700');
    }
    
    drawIceShard(ctx, p) {
        // Trail
        this.drawTrail(ctx, p, '#4FC3F7');
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Buz kristali
        const gradient = ctx.createLinearGradient(-8, 0, 8, 0);
        gradient.addColorStop(0, '#B3E5FC');
        gradient.addColorStop(0.5, '#4FC3F7');
        gradient.addColorStop(1, '#0288D1');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(0, -5);
        ctx.lineTo(-8, 0);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        
        // Parlaklık
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(4, -2);
        ctx.lineTo(0, -3);
        ctx.lineTo(-2, 0);
        ctx.lineTo(2, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Buz parçacıkları
        ctx.fillStyle = 'rgba(179, 229, 252, 0.5)';
        for (let i = 0; i < 3; i++) {
            const angle = p.rotation + (i - 1) * 0.3;
            const dist = 8 + Math.sin(p.life * 0.01 + i) * 3;
            ctx.beginPath();
            ctx.arc(
                p.x - Math.cos(angle) * dist,
                p.y - Math.sin(angle) * dist,
                2, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    drawCannonball(ctx, p) {
        // Trail (duman)
        for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            ctx.fillStyle = `rgba(128, 128, 128, ${t.alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 4 + (p.trail.length - i) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Gölge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x + 2, p.y + 2, p.radius, p.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top mermisi
        const gradient = ctx.createRadialGradient(p.x - 3, p.y - 3, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, '#607D8B');
        gradient.addColorStop(0.7, '#455A64');
        gradient.addColorStop(1, '#263238');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Metal parlaklık
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x - 3, p.y - 3, p.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.isCrit) this.drawCritGlow(ctx, p, '#FF9800');
    }
    
    drawMagicOrb(ctx, p) {
        // Trail (sihir izi)
        for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            ctx.fillStyle = `rgba(149, 117, 205, ${t.alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3 * t.alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dış aura
        const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.5);
        aura.addColorStop(0, 'rgba(225, 190, 231, 0.6)');
        aura.addColorStop(0.5, 'rgba(149, 117, 205, 0.3)');
        aura.addColorStop(1, 'rgba(149, 117, 205, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ana küre
        const gradient = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, '#E1BEE7');
        gradient.addColorStop(0.5, '#9575CD');
        gradient.addColorStop(1, '#7B1FA2');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // İç parlaklık
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x - 2, p.y - 2, p.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Dönen rune
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.01);
        ctx.strokeStyle = 'rgba(225, 190, 231, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.2, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
        
        if (p.isCrit) this.drawCritGlow(ctx, p, '#E040FB');
    }
    
    drawBasicProjectile(ctx, p) {
        this.drawTrail(ctx, p, p.color);
        
        const gradient = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, this.lightenColor(p.color, 50));
        gradient.addColorStop(1, p.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTrail(ctx, p, color) {
        for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            ctx.fillStyle = color.startsWith('rgba') ? color : this.hexToRgba(color, t.alpha);
            ctx.beginPath();
            ctx.arc(t.x, t.y, p.radius * 0.5 * t.alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawCritGlow(ctx, p, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = this.hexToRgba(color, 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    hexToRgba(hex, alpha) {
        const num = parseInt(hex.replace("#", ""), 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    clear() {
        for (const p of this.active) this.remove(p);
    }
}

export default ProjectilePool;
