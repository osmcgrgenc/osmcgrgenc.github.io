// Harita ve yol sistemi
class MapSystem {
    constructor(canvasWidth, canvasHeight, mapType = 'default') {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.gridSize = 40;
        this.mapType = mapType;
        this.path = this.generatePath(mapType);
        this.barrierOpen = false; // Çatal başta kapalı
    }
    
    // Yol oluştur (harita tipine göre)
    generatePath(mapType) {
        const startX = 0;
        const startY = this.height / 2;
        const endX = this.width;
        const endY = this.height / 2;
        
        if (mapType === 'spiral') {
            return this.generateSpiralPath(startX, startY, endX, endY);
        } else if (mapType === 'zigzag') {
            return this.generateZigzagPath(startX, startY, endX, endY);
        } else {
            // Default: S şeklinde
            return this.generateDefaultPath(startX, startY, endX, endY);
        }
    }
    
    // Varsayılan harita (S şeklinde)
    generateDefaultPath(startX, startY, endX, endY) {
        const mainPath = [
            { x: startX, y: startY },
            { x: this.width * 0.2, y: startY },
            { x: this.width * 0.3, y: startY - 100 },
            { x: this.width * 0.5, y: startY - 100 },
            { x: this.width * 0.6, y: startY },
            { x: this.width * 0.7, y: startY + 100 },
            { x: this.width * 0.9, y: startY + 100 },
            { x: endX, y: endY }
        ];
        
        const forkPath = [
            { x: this.width * 0.5, y: startY - 100 },
            { x: this.width * 0.55, y: startY - 150 },
            { x: this.width * 0.7, y: startY - 150 },
            { x: this.width * 0.75, y: startY - 100 },
            { x: this.width * 0.9, y: startY + 100 }
        ];
        
        return {
            main: mainPath,
            fork: forkPath,
            barrierPosition: { x: this.width * 0.5, y: startY - 100 }
        };
    }
    
    // Spiral harita
    generateSpiralPath(startX, startY, endX, endY) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const path = [];
        
        // Spiral dıştan içe, sonra merkezden çıkışa
        const segments = 8;
        const radius = Math.min(this.width, this.height) * 0.4;
        
        // Dıştan içe spiral
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = radius * (1 - i / segments * 0.5);
            path.push({
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r
            });
        }
        
        // Merkezden çıkışa
        path.push({ x: this.width * 0.8, y: this.height * 0.2 });
        path.push({ x: this.width, y: this.height * 0.2 });
        
        return {
            main: path,
            fork: [],
            barrierPosition: null
        };
    }
    
    // Zigzag harita
    generateZigzagPath(startX, startY, endX, endY) {
        const path = [
            { x: startX, y: startY },
            { x: this.width * 0.15, y: startY },
            { x: this.width * 0.2, y: startY - 80 },
            { x: this.width * 0.35, y: startY - 80 },
            { x: this.width * 0.4, y: startY + 80 },
            { x: this.width * 0.55, y: startY + 80 },
            { x: this.width * 0.6, y: startY - 80 },
            { x: this.width * 0.75, y: startY - 80 },
            { x: this.width * 0.8, y: startY + 80 },
            { x: this.width * 0.95, y: startY + 80 },
            { x: endX, y: endY }
        ];
        
        return {
            main: path,
            fork: [],
            barrierPosition: null
        };
    }
    
    // Aktif yolu al (barikat durumuna göre)
    getActivePath() {
        if (this.path.fork && this.path.fork.length > 0 && this.barrierOpen) {
            // Çatal açık: ana yolun ilk yarısı + çatal + ana yolun son yarısı
            const mainPath = this.path.main;
            const forkPath = this.path.fork;
            const barrierIndex = 3; // Ana yolun çatal noktası
            
            return [
                ...mainPath.slice(0, barrierIndex + 1),
                ...forkPath.slice(1, -1),
                ...mainPath.slice(barrierIndex + 2)
            ];
        } else {
            // Çatal kapalı veya çatal yok: sadece ana yol
            return this.path.main;
        }
    }
    
    // Harita tipini değiştir
    setMapType(mapType) {
        this.mapType = mapType;
        this.path = this.generatePath(mapType);
        this.barrierOpen = false;
    }
    
    // Mevcut harita tipini al
    getMapType() {
        return this.mapType;
    }
    
    // Barikat durumunu değiştir
    toggleBarrier() {
        this.barrierOpen = !this.barrierOpen;
        return this.barrierOpen;
    }
    
    // Grid pozisyonuna çevir
    toGridPos(x, y) {
        return {
            gridX: Math.floor(x / this.gridSize),
            gridY: Math.floor(y / this.gridSize)
        };
    }
    
    // Grid pozisyonundan gerçek pozisyona çevir
    fromGridPos(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }
    
    // Yol üzerinde mi kontrol et
    isOnPath(x, y, margin = 20) { // 15'ten 20'ye artırıldı (daha geniş yol)
        const path = this.getActivePath();
        
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / (length * length)));
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            
            const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
            
            if (dist < margin) {
                return true;
            }
        }
        
        return false;
    }
    
    // Kule yerleştirilebilir mi?
    canPlaceTower(x, y, towers) {
        // Yol üzerinde değilse
        if (this.isOnPath(x, y)) {
            return false;
        }
        
        // Diğer kulelerle çakışmıyorsa
        for (const tower of towers) {
            const dx = tower.position.x - x;
            const dy = tower.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.gridSize) {
                return false;
            }
        }
        
        return true;
    }
    
    // Çiz
    draw(ctx) {
        // Arka plan (yeni renk paleti - koyu toprak tonları)
        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#2F2A24');
        bgGradient.addColorStop(1, '#3A332B');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Yol çizimi (daha detaylı)
        const activePath = this.getActivePath();
        
        // Yol gölgesi
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 42; // 32'den 42'ye artırıldı
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(activePath[0].x, activePath[0].y + 2);
        for (let i = 1; i < activePath.length; i++) {
            ctx.lineTo(activePath[i].x, activePath[i].y + 2);
        }
        ctx.stroke();
        
        // Ana yol (açık taş rengi - yeni palet)
        const pathGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        pathGradient.addColorStop(0, '#B8A98A');
        pathGradient.addColorStop(0.5, '#A89A7A');
        pathGradient.addColorStop(1, '#9A8C6A');
        ctx.strokeStyle = pathGradient;
        ctx.lineWidth = 40; // 30'dan 40'a artırıldı (daha geniş yol)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(activePath[0].x, activePath[0].y);
        for (let i = 1; i < activePath.length; i++) {
            ctx.lineTo(activePath[i].x, activePath[i].y);
        }
        ctx.stroke();
        
        // Yol kenarı (iç)
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(activePath[0].x, activePath[0].y);
        for (let i = 1; i < activePath.length; i++) {
            ctx.lineTo(activePath[i].x, activePath[i].y);
        }
        ctx.stroke();
        
        // Yol kenarı (dış - highlight)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(activePath[0].x, activePath[0].y);
        for (let i = 1; i < activePath.length; i++) {
            ctx.lineTo(activePath[i].x, activePath[i].y);
        }
        ctx.stroke();
        
        // Yol deseni (çizgiler)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(activePath[0].x, activePath[0].y);
        for (let i = 1; i < activePath.length; i++) {
            ctx.lineTo(activePath[i].x, activePath[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Başlangıç noktası (daha belirgin)
        const startGradient = ctx.createRadialGradient(
            activePath[0].x, activePath[0].y,
            0,
            activePath[0].x, activePath[0].y,
            20
        );
        startGradient.addColorStop(0, '#4ecdc4');
        startGradient.addColorStop(0.7, '#45b8b0');
        startGradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
        ctx.fillStyle = startGradient;
        ctx.beginPath();
        ctx.arc(activePath[0].x, activePath[0].y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(activePath[0].x, activePath[0].y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', activePath[0].x, activePath[0].y);
        
        // Bitiş noktası (daha belirgin)
        const endGradient = ctx.createRadialGradient(
            activePath[activePath.length - 1].x, activePath[activePath.length - 1].y,
            0,
            activePath[activePath.length - 1].x, activePath[activePath.length - 1].y,
            20
        );
        endGradient.addColorStop(0, '#e94560');
        endGradient.addColorStop(0.7, '#d63651');
        endGradient.addColorStop(1, 'rgba(233, 69, 96, 0)');
        ctx.fillStyle = endGradient;
        ctx.beginPath();
        ctx.arc(activePath[activePath.length - 1].x, activePath[activePath.length - 1].y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(activePath[activePath.length - 1].x, activePath[activePath.length - 1].y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('END', activePath[activePath.length - 1].x, activePath[activePath.length - 1].y);
        
        // Barikat gösterimi (sadece default haritada)
        if (this.path.barrierPosition && !this.barrierOpen) {
            // Barikat gölgesi
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(this.path.barrierPosition.x - 18, this.path.barrierPosition.y - 18, 36, 36);
            
            // Barikat (gradient)
            const barrierGradient = ctx.createLinearGradient(
                this.path.barrierPosition.x - 20,
                this.path.barrierPosition.y - 20,
                this.path.barrierPosition.x + 20,
                this.path.barrierPosition.y + 20
            );
            barrierGradient.addColorStop(0, '#e94560');
            barrierGradient.addColorStop(0.5, '#d63651');
            barrierGradient.addColorStop(1, '#c1272d');
            ctx.fillStyle = barrierGradient;
            ctx.fillRect(this.path.barrierPosition.x - 20, this.path.barrierPosition.y - 20, 40, 40);
            
            // Barikat kenarı
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.path.barrierPosition.x - 20, this.path.barrierPosition.y - 20, 40, 40);
            
            // Barikat ikonu
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚧', this.path.barrierPosition.x, this.path.barrierPosition.y);
        }
    }
}

export default MapSystem;

