// Hasar sayıları sistemi (floating damage numbers)
class DamageNumbers {
    constructor() {
        this.numbers = [];
    }
    
    // Hasar sayısı ekle
    addDamage(x, y, damage, isCrit = false, isMagic = false) {
        this.numbers.push({
            x: x + (Math.random() - 0.5) * 20, // Rastgele offset
            y: y,
            damage: Math.floor(damage),
            life: 1000, // 1 saniye
            maxLife: 1000,
            vx: (Math.random() - 0.5) * 2, // Rastgele yatay hız
            vy: -2, // Yukarı hareket
            isCrit: isCrit,
            isMagic: isMagic,
            alpha: 1
        });
    }
    
    // Güncelle
    update(deltaTime) {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const num = this.numbers[i];
            
            // Hareket
            num.x += num.vx * deltaTime * 0.1;
            num.y += num.vy * deltaTime * 0.1;
            
            // Yavaşlama
            num.vx *= 0.98;
            num.vy *= 0.98;
            
            // Yaşam süresi
            num.life -= deltaTime;
            num.alpha = num.life / num.maxLife;
            
            // Ölü sayıları kaldır
            if (num.life <= 0 || num.alpha <= 0) {
                this.numbers.splice(i, 1);
            }
        }
    }
    
    // Çiz
    draw(ctx) {
        for (const num of this.numbers) {
            ctx.save();
            ctx.globalAlpha = num.alpha;
            
            // Kritik vuruş için daha büyük ve altın renk (yeni palet)
            const fontSize = num.isCrit ? 20 : 16;
            const color = num.isCrit ? '#F2B705' : (num.isMagic ? '#9b59b6' : '#fff');
            
            // Gölge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`-${num.damage}`, num.x + 1, num.y + 1);
            
            // Ana metin
            ctx.fillStyle = color;
            ctx.fillText(`-${num.damage}`, num.x, num.y);
            
            // Kritik için yıldız
            if (num.isCrit) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '12px Arial';
                ctx.fillText('⭐', num.x, num.y - 15);
            }
            
            ctx.restore();
        }
    }
    
    // Temizle
    clear() {
        this.numbers = [];
    }
}

export default DamageNumbers;

