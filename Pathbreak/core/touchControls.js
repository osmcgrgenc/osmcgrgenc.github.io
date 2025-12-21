// Touch kontrolleri yönetimi
class TouchControls {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.touchStartPos = null;
        this.touchStartTime = 0;
        this.lastTapTime = 0;
        this.tapDelay = 300; // ms
        this.isDragging = false;
        this.dragThreshold = 10; // px
        
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        // Touch start
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });
        
        // Touch move
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });
        
        // Touch end
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
        
        // Touch cancel
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchStartPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        
        this.touchStartTime = Date.now();
        this.isDragging = false;
    }
    
    handleTouchMove(e) {
        if (!this.touchStartPos) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        const dx = currentX - this.touchStartPos.x;
        const dy = currentY - this.touchStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Drag threshold kontrolü
        if (distance > this.dragThreshold) {
            this.isDragging = true;
        }
    }
    
    handleTouchEnd(e) {
        if (!this.touchStartPos) return;
        
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const endX = touch.clientX - rect.left;
        const endY = touch.clientY - rect.top;
        
        const dx = endX - this.touchStartPos.x;
        const dy = endY - this.touchStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const touchDuration = Date.now() - this.touchStartTime;
        
        // Tap kontrolü (kısa süre, küçük mesafe)
        if (!this.isDragging && distance < this.dragThreshold && touchDuration < this.tapDelay) {
            const currentTime = Date.now();
            
            // Double tap kontrolü
            if (currentTime - this.lastTapTime < this.tapDelay) {
                this.handleDoubleTap(endX, endY);
            } else {
                this.handleTap(endX, endY);
            }
            
            this.lastTapTime = currentTime;
        }
        
        this.touchStartPos = null;
        this.isDragging = false;
    }
    
    handleTap(x, y) {
        // Normal click gibi davran
        const clickEvent = new MouseEvent('click', {
            clientX: x + this.canvas.getBoundingClientRect().left,
            clientY: y + this.canvas.getBoundingClientRect().top,
            bubbles: true,
            cancelable: true
        });
        
        this.canvas.dispatchEvent(clickEvent);
    }
    
    handleDoubleTap(x, y) {
        // Double tap: Kule seçimi veya hızlı işlem
        const state = this.game.state.getState();
        
        // Eğer kule seçiliyse, hızlı yükseltme
        if (state.selectedTower) {
            this.game.upgradeTower(state.selectedTower);
        } else {
            // Kule seçimi
            this.handleTap(x, y);
        }
    }
    
    // Touch pozisyonunu al
    getTouchPos(e) {
        const touch = e.touches[0] || e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
}

export default TouchControls;

