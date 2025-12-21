// Game loop manager
class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameId = null;
        this.isRunning = false;
        
        // Mobil cihazlarda FPS düşür (performans için)
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 768);
        this.fps = this.isMobile ? 30 : 60; // Mobilde 30 FPS
        this.deltaTime = 1000 / this.fps;
        
        // FPS takibi (debug için)
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.lastFpsUpdate = 0;
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame((time) => this.loop(time));
    }
    
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }
    
    loop(currentTime) {
        if (!this.isRunning) return;
        
        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // FPS takibi
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fpsCounter = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        // Fixed timestep için accumulator
        this.accumulator += delta;
        
        // Mobilde maksimum delta sınırı (spike önleme)
        const maxDelta = this.isMobile ? 50 : 100;
        const clampedDelta = Math.min(delta, maxDelta);
        
        while (this.accumulator >= this.deltaTime) {
            this.updateFn(this.deltaTime);
            this.accumulator -= this.deltaTime;
        }
        
        // Render her frame'de
        this.renderFn();
        
        this.frameId = requestAnimationFrame((time) => this.loop(time));
    }
    
    // FPS al (debug için)
    getFPS() {
        return this.fpsCounter;
    }
    
    setSpeed(speed) {
        // Hız değiştiğinde deltaTime'ı ayarla
        this.deltaTime = (1000 / this.fps) / speed;
    }
}

export default GameLoop;

