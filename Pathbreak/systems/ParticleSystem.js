// Partikül efekti sistemi
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 100;
    }
    
    // Partikül oluştur
    createParticle(x, y, type = 'explosion') {
        if (this.particles.length >= this.maxParticles) return;
        
        const particleConfigs = {
            explosion: {
                count: 8,
                color: '#ff6b6b',
                speed: 2,
                life: 500,
                size: 3
            },
            crit: {
                count: 5,
                color: '#ffd700',
                speed: 1.5,
                life: 400,
                size: 2
            },
            freeze: {
                count: 6,
                color: '#4ecdc4',
                speed: 1,
                life: 600,
                size: 2
            },
            burn: {
                count: 4,
                color: '#ff6b6b',
                speed: 0.5,
                life: 800,
                size: 2
            }
        };
        
        const config = particleConfigs[type] || particleConfigs.explosion;
        
        for (let i = 0; i < config.count; i++) {
            const angle = (Math.PI * 2 / config.count) * i + (Math.random() - 0.5) * 0.5;
            const speed = config.speed * (0.7 + Math.random() * 0.6);
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: config.life,
                maxLife: config.life,
                size: config.size * (0.8 + Math.random() * 0.4),
                color: config.color,
                alpha: 1
            });
        }
    }
    
    // Partikülleri güncelle
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Hareket
            p.x += p.vx * deltaTime * 0.1;
            p.y += p.vy * deltaTime * 0.1;
            
            // Yerçekimi (bazı partiküller için)
            p.vy += 0.05 * deltaTime * 0.1;
            
            // Yaşam süresi
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
            
            // Ölü partikülleri kaldır
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Partikülleri çiz
    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            
            // Partikül gölgesi
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x + 1, p.y + 1, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Ana partikül
            const gradient = ctx.createRadialGradient(
                p.x - p.size * 0.3,
                p.y - p.size * 0.3,
                0,
                p.x,
                p.y,
                p.size
            );
            gradient.addColorStop(0, this.lightenColor(p.color, 50));
            gradient.addColorStop(1, p.color);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Temizle
    clear() {
        this.particles = [];
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

export default ParticleSystem;

