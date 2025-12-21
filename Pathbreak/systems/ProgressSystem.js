// Meta ilerleme sistemi (localStorage tabanlı)
class ProgressSystem {
    constructor() {
        this.storageKey = 'pathbreak_progress';
        this.progress = this.loadProgress();
    }
    
    // İlerlemeyi yükle
    loadProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Progress yüklenemedi:', e);
        }
        
        // Varsayılan ilerleme
        return {
            highScores: [],
            unlockedTowers: ['archer', 'freeze', 'cannon'], // Başlangıçta 3 kule açık
            unlockedMaps: ['default'], // Başlangıçta sadece default harita
            permanentUpgrades: {
                startingGold: 0,
                startingHealth: 0,
                goldMultiplier: 1,
                experience: 0
            },
            totalRuns: 0,
            totalWavesCompleted: 0,
            totalEnemiesKilled: 0,
            achievements: []
        };
    }
    
    // İlerlemeyi kaydet
    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.error('Progress kaydedilemedi:', e);
        }
    }
    
    // Skor ekle
    addScore(score, wave, artifacts) {
        const scoreEntry = {
            score: score,
            wave: wave,
            artifacts: artifacts.map(a => a.id),
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.progress.highScores.push(scoreEntry);
        
        // En yüksek 10 skoru tut
        this.progress.highScores.sort((a, b) => b.score - a.score);
        this.progress.highScores = this.progress.highScores.slice(0, 10);
        
        this.saveProgress();
        
        // Achievement kontrolü
        this.checkAchievements(score, wave);
    }
    
    // En yüksek skorları al
    getHighScores(limit = 10) {
        return this.progress.highScores.slice(0, limit);
    }
    
    // En yüksek skor
    getBestScore() {
        if (this.progress.highScores.length === 0) return 0;
        return this.progress.highScores[0].score;
    }
    
    // Kule unlock kontrolü
    isTowerUnlocked(towerType) {
        return this.progress.unlockedTowers.includes(towerType);
    }
    
    // Kule unlock et
    unlockTower(towerType) {
        if (!this.progress.unlockedTowers.includes(towerType)) {
            this.progress.unlockedTowers.push(towerType);
            this.saveProgress();
            return true;
        }
        return false;
    }
    
    // Harita unlock kontrolü
    isMapUnlocked(mapType) {
        return this.progress.unlockedMaps.includes(mapType);
    }
    
    // Harita unlock et
    unlockMap(mapType) {
        if (!this.progress.unlockedMaps.includes(mapType)) {
            this.progress.unlockedMaps.push(mapType);
            this.saveProgress();
            return true;
        }
        return false;
    }
    
    // Kalıcı upgrade al
    getPermanentUpgrades() {
        return { ...this.progress.permanentUpgrades };
    }
    
    // Kalıcı upgrade ekle
    addPermanentUpgrade(type, value) {
        if (this.progress.permanentUpgrades[type] !== undefined) {
            this.progress.permanentUpgrades[type] += value;
            this.saveProgress();
        }
    }
    
    // Run istatistikleri güncelle
    updateRunStats(wavesCompleted, enemiesKilled) {
        this.progress.totalRuns++;
        this.progress.totalWavesCompleted += wavesCompleted;
        this.progress.totalEnemiesKilled += enemiesKilled;
        this.saveProgress();
    }
    
    // Achievement kontrolü
    checkAchievements(score, wave) {
        const achievements = [];
        
        // İlk zafer
        if (wave >= 10 && !this.progress.achievements.includes('first_victory')) {
            achievements.push({
                id: 'first_victory',
                name: 'İlk Zafer',
                description: '10 dalgayı tamamla',
                icon: '🏆'
            });
            this.progress.achievements.push('first_victory');
        }
        
        // Yüksek skor
        if (score >= 1000 && !this.progress.achievements.includes('high_scorer')) {
            achievements.push({
                id: 'high_scorer',
                name: 'Yüksek Skor',
                description: '1000+ skor elde et',
                icon: '⭐'
            });
            this.progress.achievements.push('high_scorer');
        }
        
        // Mükemmel oyun
        if (wave >= 10 && score >= 1500 && !this.progress.achievements.includes('perfect_run')) {
            achievements.push({
                id: 'perfect_run',
                name: 'Mükemmel Oyun',
                description: '10+ dalga ve 1500+ skor',
                icon: '💎'
            });
            this.progress.achievements.push('perfect_run');
        }
        
        // 10 run
        if (this.progress.totalRuns >= 10 && !this.progress.achievements.includes('veteran')) {
            achievements.push({
                id: 'veteran',
                name: 'Veteran',
                description: '10 run tamamla',
                icon: '🎖️'
            });
            this.progress.achievements.push('veteran');
        }
        
        // 1000 düşman öldür
        if (this.progress.totalEnemiesKilled >= 1000 && !this.progress.achievements.includes('slayer')) {
            achievements.push({
                id: 'slayer',
                name: 'Katil',
                description: '1000 düşman öldür',
                icon: '⚔️'
            });
            this.progress.achievements.push('slayer');
        }
        
        // Büyücü unlock (5 run sonra)
        if (this.progress.totalRuns >= 5 && !this.isTowerUnlocked('mage')) {
            this.unlockTower('mage');
            achievements.push({
                id: 'mage_unlocked',
                name: 'Büyücü Açıldı',
                description: 'Büyücü kulesi artık kullanılabilir',
                icon: '🔮'
            });
        }
        
        // Harita unlock'ları
        if (this.progress.totalRuns >= 3 && !this.isMapUnlocked('spiral')) {
            this.unlockMap('spiral');
            achievements.push({
                id: 'spiral_unlocked',
                name: 'Spiral Harita Açıldı',
                description: 'Spiral harita artık kullanılabilir',
                icon: '🌀'
            });
        }
        
        if (this.progress.totalRuns >= 7 && !this.isMapUnlocked('zigzag')) {
            this.unlockMap('zigzag');
            achievements.push({
                id: 'zigzag_unlocked',
                name: 'Zigzag Harita Açıldı',
                description: 'Zigzag harita artık kullanılabilir',
                icon: '⚡'
            });
        }
        
        if (achievements.length > 0) {
            this.saveProgress();
        }
        
        return achievements;
    }
    
    // Tüm achievement'leri al
    getAchievements() {
        const achievementData = {
            first_victory: { name: 'İlk Zafer', description: '10 dalgayı tamamla', icon: '🏆' },
            high_scorer: { name: 'Yüksek Skor', description: '1000+ skor elde et', icon: '⭐' },
            perfect_run: { name: 'Mükemmel Oyun', description: '10+ dalga ve 1500+ skor', icon: '💎' },
            veteran: { name: 'Veteran', description: '10 run tamamla', icon: '🎖️' },
            slayer: { name: 'Katil', description: '1000 düşman öldür', icon: '⚔️' },
            mage_unlocked: { name: 'Büyücü Açıldı', description: 'Büyücü kulesi artık kullanılabilir', icon: '🔮' },
            spiral_unlocked: { name: 'Spiral Harita Açıldı', description: 'Spiral harita artık kullanılabilir', icon: '🌀' },
            zigzag_unlocked: { name: 'Zigzag Harita Açıldı', description: 'Zigzag harita artık kullanılabilir', icon: '⚡' }
        };
        
        return this.progress.achievements.map(id => ({
            id,
            ...achievementData[id]
        }));
    }
    
    // İstatistikleri al
    getStats() {
        return {
            totalRuns: this.progress.totalRuns,
            totalWavesCompleted: this.progress.totalWavesCompleted,
            totalEnemiesKilled: this.progress.totalEnemiesKilled,
            bestScore: this.getBestScore(),
            bestWave: this.progress.highScores.length > 0 ? 
                Math.max(...this.progress.highScores.map(s => s.wave)) : 0
        };
    }
    
    // İlerlemeyi sıfırla (debug için)
    resetProgress() {
        localStorage.removeItem(this.storageKey);
        this.progress = this.loadProgress();
    }
}

export default ProgressSystem;

