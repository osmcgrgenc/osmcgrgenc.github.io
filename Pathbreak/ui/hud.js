// HUD (Head-Up Display) yönetimi
class HUD {
    constructor() {
        this.elements = {
            waveNumber: document.getElementById('wave-number'),
            health: document.getElementById('health'),
            gold: document.getElementById('gold'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            speed1x: document.getElementById('speed-1x'),
            speed2x: document.getElementById('speed-2x'),
            panicBtn: document.getElementById('panic-btn'),
            preparationScreen: document.getElementById('preparation-screen'),
            nextWaveInfo: document.getElementById('next-wave-info'),
            readyBtn: document.getElementById('ready-btn'),
            gameOverScreen: document.getElementById('game-over-screen'),
            gameOverTitle: document.getElementById('game-over-title'),
            finalScore: document.getElementById('final-score'),
            restartBtn: document.getElementById('restart-btn')
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Hız kontrolleri
        this.elements.speed1x.addEventListener('click', () => {
            this.setSpeed(1);
        });
        
        this.elements.speed2x.addEventListener('click', () => {
            this.setSpeed(2);
        });
    }
    
    // State'i güncelle
    update(state) {
        this.elements.waveNumber.textContent = state.wave || 0;
        this.elements.health.textContent = state.health || 20;
        this.elements.gold.textContent = state.gold || 0;
        
        // Panic token durumu
        if (state.panicTokens > 0) {
            this.elements.panicBtn.textContent = `Panic Token (${state.panicTokens})`;
            this.elements.panicBtn.disabled = false;
        } else {
            this.elements.panicBtn.textContent = 'Panic Token (0)';
            this.elements.panicBtn.disabled = true;
        }
        
        // Oyun durumu
        if (state.gameState === 'playing') {
            this.elements.startBtn.classList.add('hidden');
            this.elements.pauseBtn.classList.remove('hidden');
        } else if (state.gameState === 'paused') {
            this.elements.startBtn.classList.remove('hidden');
            this.elements.pauseBtn.classList.add('hidden');
        }
    }
    
    // Hız ayarla
    setSpeed(speed) {
        if (speed === 1) {
            this.elements.speed1x.classList.add('active');
            this.elements.speed2x.classList.remove('active');
        } else {
            this.elements.speed1x.classList.remove('active');
            this.elements.speed2x.classList.add('active');
        }
    }
    
    // Hazırlık ekranını göster
    showPreparationScreen(waveInfo) {
        if (!waveInfo) {
            this.elements.preparationScreen.classList.add('hidden');
            return;
        }
        
        let infoText = `Dalga ${waveInfo.wave} Hazırlığı\n\n`;
        infoText += `Düşmanlar:\n`;
        
        const enemyNames = {
            runner: 'Runner',
            tank: 'Tank',
            swarm: 'Swarm',
            miniBoss: 'Mini-Boss'
        };
        
        for (const [type, count] of Object.entries(waveInfo.enemies)) {
            infoText += `- ${enemyNames[type] || type}: ${count}\n`;
        }
        
        infoText += `\nÖdül: ${waveInfo.reward} altın`;
        
        this.elements.nextWaveInfo.textContent = infoText;
        this.elements.preparationScreen.classList.remove('hidden');
    }
    
    // Hazırlık ekranını gizle
    hidePreparationScreen() {
        this.elements.preparationScreen.classList.add('hidden');
    }
    
    // Oyun bitiş ekranını göster
    showGameOverScreen(victory, score, wave) {
        if (victory) {
            this.elements.gameOverTitle.textContent = 'Tebrikler!';
            this.elements.finalScore.textContent = `Tüm dalgaları tamamladınız!\nSkor: ${score}\nDalga: ${wave}`;
        } else {
            this.elements.gameOverTitle.textContent = 'Oyun Bitti';
            this.elements.finalScore.textContent = `Skor: ${score}\nDalga: ${wave}`;
        }
        
        this.elements.gameOverScreen.classList.remove('hidden');
    }
    
    // Oyun bitiş ekranını gizle
    hideGameOverScreen() {
        this.elements.gameOverScreen.classList.add('hidden');
    }
    
    // Event listener'ları dışarıya expose et
    onStart(callback) {
        this.elements.startBtn.addEventListener('click', callback);
    }
    
    onPause(callback) {
        this.elements.pauseBtn.addEventListener('click', callback);
    }
    
    onReady(callback) {
        this.elements.readyBtn.addEventListener('click', callback);
    }
    
    onPanic(callback) {
        this.elements.panicBtn.addEventListener('click', callback);
    }
    
    onRestart(callback) {
        this.elements.restartBtn.addEventListener('click', callback);
    }
}

export default HUD;

