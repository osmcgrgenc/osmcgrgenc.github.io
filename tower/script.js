// ==========================================
// 🏰 TOWER DEFENSE - TAM VERSİYON
// ==========================================

// ===== SES SİSTEMİ =====
const AudioManager = {
    sfxEnabled: true,
    audioContext: null,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API desteklenmiyor');
        }
    },
    
    playSound(type) {
        if (!this.sfxEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const sounds = {
                shoot: { freq: 600, duration: 0.08, type: 'square', gain: 0.08 },
                hit: { freq: 250, duration: 0.1, type: 'sawtooth', gain: 0.06 },
                kill: { freq: 500, duration: 0.15, type: 'triangle', gain: 0.1 },
                place: { freq: 400, duration: 0.12, type: 'sine', gain: 0.1 },
                wave: { freq: 350, duration: 0.4, type: 'sine', gain: 0.12 },
                powerup: { freq: 800, duration: 0.25, type: 'sine', gain: 0.1 },
                upgrade: { freq: 600, duration: 0.2, type: 'triangle', gain: 0.1 },
                gameover: { freq: 150, duration: 0.6, type: 'sawtooth', gain: 0.15 },
                victory: { freq: 600, duration: 0.5, type: 'sine', gain: 0.12 },
                freeze: { freq: 1000, duration: 0.3, type: 'sine', gain: 0.08 },
                explosion: { freq: 80, duration: 0.25, type: 'sawtooth', gain: 0.12 },
                combo: { freq: 700, duration: 0.15, type: 'triangle', gain: 0.1 }
            };
            
            const sound = sounds[type] || sounds.shoot;
            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.freq, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(sound.gain, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (e) {
            // Ses hatası, sessizce devam et
        }
    },
    
    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
};

// ===== HIGH SCORE SİSTEMİ =====
const HighScoreManager = {
    storageKey: 'towerDefenseScores_v2',
    maxScores: 10,
    
    getScores() {
        try {
            const scores = localStorage.getItem(this.storageKey);
            return scores ? JSON.parse(scores) : [];
        } catch (e) {
            return [];
        }
    },
    
    addScore(score, wave, difficulty, enemiesKilled, towersPlaced) {
        const scores = this.getScores();
        const newScore = {
            score, wave, difficulty, enemiesKilled, towersPlaced,
            date: new Date().toISOString()
        };
        
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        
        const topScores = scores.slice(0, this.maxScores);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(topScores));
        } catch (e) {}
        
        return scores.indexOf(newScore) < this.maxScores;
    },
    
    getScoresByDifficulty(difficulty) {
        if (difficulty === 'all') return this.getScores();
        return this.getScores().filter(s => s.difficulty === difficulty);
    }
};

// ===== BAŞARIM SİSTEMİ =====
const AchievementManager = {
    storageKey: 'towerDefenseAchievements_v2',
    
    achievements: [
        { id: 'first_kill', name: 'İlk Kan', desc: 'İlk düşmanı öldür', icon: '🎯' },
        { id: 'wave_5', name: 'Dayanıklı', desc: '5. dalgaya ulaş', icon: '🌊' },
        { id: 'wave_10', name: 'Şampiyon', desc: '10. dalgayı tamamla', icon: '🏆' },
        { id: 'kill_50', name: 'Avcı', desc: '50 düşman öldür', icon: '🎯' },
        { id: 'kill_100', name: 'Katil', desc: '100 düşman öldür', icon: '💀' },
        { id: 'boss_kill', name: 'Boss Avcısı', desc: 'Bir boss öldür', icon: '👑' },
        { id: 'tower_10', name: 'Mimar', desc: '10 kule yerleştir', icon: '🏗️' },
        { id: 'score_1000', name: 'Puancı', desc: '1000 puan kazan', icon: '⭐' },
        { id: 'score_5000', name: 'Yüksek Skor', desc: '5000 puan kazan', icon: '🌟' },
        { id: 'no_damage', name: 'Dokunulmaz', desc: 'Bir dalgayı hasarsız tamamla', icon: '🛡️' },
        { id: 'all_towers', name: 'Koleksiyoncu', desc: 'Tüm kule tiplerini kullan', icon: '🎨' },
        { id: 'upgrade_max', name: 'Güçlendirici', desc: 'Bir kuleyi max seviyeye yükselt', icon: '⬆️' },
        { id: 'combo_5', name: 'Combo Ustası', desc: '5x combo yap', icon: '🔥' },
        { id: 'nightmare_win', name: 'Kabus Avcısı', desc: 'Kabus modunda kazan', icon: '😈' }
    ],
    
    getUnlocked() {
        try {
            const unlocked = localStorage.getItem(this.storageKey);
            return unlocked ? JSON.parse(unlocked) : [];
        } catch (e) {
            return [];
        }
    },
    
    unlock(achievementId) {
        const unlocked = this.getUnlocked();
        if (!unlocked.includes(achievementId)) {
            unlocked.push(achievementId);
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(unlocked));
            } catch (e) {}
            
            const achievement = this.achievements.find(a => a.id === achievementId);
            if (achievement) this.showPopup(achievement);
            return true;
        }
        return false;
    },
    
    showPopup(achievement) {
        AudioManager.playSound('powerup');
        const popup = document.getElementById('achievementPopup');
        const nameEl = document.getElementById('achievementName');
        nameEl.textContent = `${achievement.icon} ${achievement.name}`;
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('hidden'), 3000);
    },
    
    check(gs) {
        if (gs.enemiesKilled >= 1) this.unlock('first_kill');
        if (gs.enemiesKilled >= 50) this.unlock('kill_50');
        if (gs.enemiesKilled >= 100) this.unlock('kill_100');
        if (gs.wave >= 5) this.unlock('wave_5');
        if (gs.towersPlaced >= 10) this.unlock('tower_10');
        if (gs.score >= 1000) this.unlock('score_1000');
        if (gs.score >= 5000) this.unlock('score_5000');
        if (gs.maxCombo >= 5) this.unlock('combo_5');
    }
};

// ===== OYUN DURUMU =====
const gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    wave: 0,
    lives: 10,
    maxLives: 10,
    energy: 100,
    lastFrameTime: 0,
    enemySpawnTimer: 0,
    enemySpawnInterval: 2000,
    waveEnemyCount: 0,
    waveEnemiesSpawned: 0,
    waveEnemiesKilled: 0,
    enemies: [],
    towers: [],
    bullets: [],
    selectedTowerType: 'basic',
    enemiesKilled: 0,
    towersPlaced: 0,
    startTime: 0,
    isBossWave: false,
    difficulty: 'easy',
    waveStartLives: 10,
    usedTowerTypes: new Set(),
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    nextWaveCountdown: 0,
    isWaveTransition: false,
    powerups: { nuke: 1, freeze: 2, doubleDamage: 1, heal: 1 },
    activeEffects: { doubleDamage: false, freeze: false },
    effectTimers: {},
    effectEndTimes: {}
};

// ===== ZORLUK AYARLARI =====
const DIFFICULTY = {
    easy: { energy: 1500, lives: 150, hpMult: 0.7, speedMult: 0.1, rewardMult: 1.3, waves: 10 },
    normal: { energy: 100, lives: 10, hpMult: 1, speedMult: 1, rewardMult: 1, waves: 12 },
    hard: { energy: 80, lives: 7, hpMult: 1.3, speedMult: 1.2, rewardMult: 0.8, waves: 15 },
    nightmare: { energy: 60, lives: 5, hpMult: 1.6, speedMult: 1.4, rewardMult: 0.6, waves: 20 }
};

// ===== SABİTLER =====
const ROWS = 5, COLS = 10;
const BULLET_SPEED = 0.5;
const MAX_LEVEL = 3;
const COMBO_TIMEOUT = 2000;

// ===== KULE TİPLERİ =====
const TOWERS = {
    basic: { name: 'Temel', cost: 50, damage: 20, cooldown: 1000, range: 'row', class: 'tower-basic', upgradeMult: 1.5 },
    rapid: { name: 'Hızlı', cost: 70, damage: 10, cooldown: 350, range: 'row', class: 'tower-rapid', upgradeMult: 1.4 },
    sniper: { name: 'Nişancı', cost: 100, damage: 60, cooldown: 1800, range: 'all', class: 'tower-sniper', upgradeMult: 1.6 },
    splash: { name: 'Bomba', cost: 120, damage: 30, cooldown: 1400, range: 'splash', class: 'tower-splash', upgradeMult: 1.5 },
    freeze: { name: 'Buz', cost: 80, damage: 5, cooldown: 700, range: 'freeze', class: 'tower-freeze', slow: 0.5, upgradeMult: 1.3 },
    laser: { name: 'Lazer', cost: 150, damage: 18, cooldown: 80, range: 'laser', class: 'tower-laser', upgradeMult: 1.4 }
};

// ===== DÜŞMAN TİPLERİ =====
const ENEMIES = {
    normal: { hpMult: 1, speedMult: 1, rewardMult: 1, class: '' },
    fast: { hpMult: 0.5, speedMult: 2, rewardMult: 1.2, class: 'fast' },
    tank: { hpMult: 3, speedMult: 0.5, rewardMult: 2.5, class: 'tank' },
    healer: { hpMult: 0.7, speedMult: 0.8, rewardMult: 1.5, class: 'healer', healAmt: 8, healInt: 1500 }
};

// ===== DOM ELEMENTLER =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const el = {
    mainMenu: $('mainMenu'),
    gameContainer: $('gameContainer'),
    gameBoard: $('gameBoard'),
    tutorialModal: $('tutorialModal'),
    pauseModal: $('pauseModal'),
    upgradeModal: $('upgradeModal'),
    gameOverModal: $('gameOverModal'),
    victoryModal: $('victoryModal'),
    highScoresModal: $('highScoresModal'),
    achievementsModal: $('achievementsModal'),
    score: $('score'),
    wave: $('wave'),
    lives: $('lives'),
    energy: $('energy'),
    waveProgress: $('waveProgress'),
    waveProgressFill: $('waveProgressFill'),
    nextWaveTimer: $('nextWaveTimer'),
    nextWaveCountdown: $('nextWaveCountdown'),
    comboDisplay: $('comboDisplay'),
    comboCount: $('comboCount'),
    activeEffects: $('activeEffects'),
    floatingNumbers: $('floatingNumbers'),
    particles: $('particles')
};

// ===== GRİD OLUŞTUR =====
function createGrid() {
    el.gameBoard.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            const handleClick = () => handleCellClick(r, c);
            cell.addEventListener('click', handleClick);
            cell.addEventListener('touchstart', e => { e.preventDefault(); handleClick(); }, { passive: false });
            
            el.gameBoard.appendChild(cell);
        }
    }
}

// ===== HÜCRE TIKLAMA =====
function handleCellClick(row, col) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const idx = row * COLS + col;
    const cell = el.gameBoard.children[idx];
    
    if (cell.classList.contains('occupied')) {
        const tower = gameState.towers.find(t => t.row === row && t.col === col);
        if (tower) showUpgradeModal(tower);
        return;
    }
    
    const type = TOWERS[gameState.selectedTowerType];
    if (gameState.energy < type.cost) {
        showNotification('⚡ Yeterli enerji yok!', 'error');
        return;
    }
    
    placeTower(row, col, gameState.selectedTowerType);
}

// ===== KULE YERLEŞTİR =====
function placeTower(row, col, type) {
    const t = TOWERS[type];
    gameState.energy -= t.cost;
    gameState.towersPlaced++;
    gameState.usedTowerTypes.add(type);
    
    const tower = {
        row, col, type,
        cooldown: 0,
        damage: t.damage,
        cooldownTime: t.cooldown,
        range: t.range,
        level: 1,
        id: Date.now() + Math.random()
    };
    
    if (type === 'freeze') tower.slow = t.slow;
    
    gameState.towers.push(tower);
    
    const idx = row * COLS + col;
    const cell = el.gameBoard.children[idx];
    cell.classList.add('occupied');
    
    const div = document.createElement('div');
    div.className = `tower ${t.class}`;
    div.dataset.towerId = tower.id;
    
    const lvl = document.createElement('span');
    lvl.className = 'tower-level';
    lvl.textContent = '1';
    div.appendChild(lvl);
    
    cell.appendChild(div);
    
    AudioManager.playSound('place');
    createParticles(cell, '#8a2be2', 5);
    updateUI();
    
    if (gameState.usedTowerTypes.size === Object.keys(TOWERS).length) {
        AchievementManager.unlock('all_towers');
    }
    AchievementManager.check(gameState);
}

// ===== KULE YÜKSELTme MODALI =====
function showUpgradeModal(tower) {
    const t = TOWERS[tower.type];
    const upgradeCost = Math.floor(t.cost * tower.level * 0.7);
    const sellValue = Math.floor(t.cost * tower.level * 0.5);
    
    const info = $('upgradeInfo');
    info.innerHTML = `
        <p><strong>${t.name} Kulesi</strong> (Seviye ${tower.level}/${MAX_LEVEL})</p>
        <p>⚔️ Hasar: ${Math.floor(tower.damage)}</p>
        <p>⏱️ Cooldown: ${tower.cooldownTime}ms</p>
        ${tower.level < MAX_LEVEL ? `
            <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.2);">
            <p><strong>⬆️ Seviye ${tower.level + 1}:</strong></p>
            <p>⚔️ Hasar: ${Math.floor(tower.damage * t.upgradeMult)}</p>
            <p>💰 Maliyet: ${upgradeCost} enerji</p>
        ` : '<p style="color: #ffd700; margin-top: 10px;">✨ Maksimum seviye!</p>'}
        <p style="margin-top: 10px; opacity: 0.8;">💰 Satış: ${sellValue} enerji</p>
    `;
    
    const upgradeBtn = $('upgradeBtn');
    upgradeBtn.disabled = tower.level >= MAX_LEVEL || gameState.energy < upgradeCost;
    upgradeBtn.onclick = () => upgradeTower(tower);
    $('sellBtn').onclick = () => sellTower(tower);
    
    el.upgradeModal.classList.add('show');
}

// ===== KULE YÜKSELT =====
function upgradeTower(tower) {
    const t = TOWERS[tower.type];
    const cost = Math.floor(t.cost * tower.level * 0.7);
    
    if (tower.level >= MAX_LEVEL || gameState.energy < cost) return;
    
    gameState.energy -= cost;
    tower.level++;
    tower.damage *= t.upgradeMult;
    tower.cooldownTime *= 0.9;
    if (tower.slow) tower.slow = Math.min(0.8, tower.slow + 0.1);
    
    const idx = tower.row * COLS + tower.col;
    const cell = el.gameBoard.children[idx];
    const div = cell.querySelector('.tower');
    div.querySelector('.tower-level').textContent = tower.level;
    
    AudioManager.playSound('upgrade');
    createParticles(cell, '#ffd700', 8);
    el.upgradeModal.classList.remove('show');
    updateUI();
    
    if (tower.level >= MAX_LEVEL) AchievementManager.unlock('upgrade_max');
}

// ===== KULE SAT =====
function sellTower(tower) {
    const t = TOWERS[tower.type];
    gameState.energy += Math.floor(t.cost * tower.level * 0.5);
    
    const idx = gameState.towers.indexOf(tower);
    if (idx !== -1) gameState.towers.splice(idx, 1);
    
    const cellIdx = tower.row * COLS + tower.col;
    const cell = el.gameBoard.children[cellIdx];
    cell.classList.remove('occupied');
    const div = cell.querySelector('.tower');
    if (div) div.remove();
    
    el.upgradeModal.classList.remove('show');
    updateUI();
}

// ===== BİLDİRİM GÖSTER =====
function showNotification(msg, type = 'error') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = msg;
    notif.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(0, 184, 148, 0.95)' : 'rgba(255, 68, 68, 0.95)'};
        color: white; padding: 12px 25px; border-radius: 8px; font-weight: bold;
        z-index: 1001; animation: fadeInOut 2s ease-out forwards;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

// ===== DÜŞMAN OLUŞTUR =====
function spawnEnemy() {
    if (gameState.waveEnemiesSpawned >= gameState.waveEnemyCount) return;
    
    const diff = DIFFICULTY[gameState.difficulty];
    const row = Math.floor(Math.random() * ROWS);
    const isBoss = gameState.isBossWave && gameState.waveEnemiesSpawned === gameState.waveEnemyCount - 1;
    
    let type = 'normal';
    if (!isBoss && gameState.wave >= 2) {
        const r = Math.random();
        if (r < 0.12 && gameState.wave >= 5) type = 'healer';
        else if (r < 0.30 && gameState.wave >= 4) type = 'tank';
        else if (r < 0.50) type = 'fast';
    }
    
    const et = ENEMIES[type];
    let hp = (40 + gameState.wave * 18) * diff.hpMult * et.hpMult;
    let speed = (0.018 + gameState.wave * 0.003) * diff.speedMult * et.speedMult;
    let reward = Math.floor(12 * diff.rewardMult * et.rewardMult);
    
    if (isBoss) {
        hp *= 6;
        speed *= 0.4;
        reward *= 6;
        type = 'boss';
    }
    
    const enemy = {
        row, x: COLS - 1,
        hp, maxHP: hp,
        speed: Math.min(speed, 0.08),
        baseSpeed: Math.min(speed, 0.08),
        id: Date.now() + Math.random(),
        isBoss, reward, type,
        slowTimer: 0, healTimer: 0
    };
    
    gameState.enemies.push(enemy);
    gameState.waveEnemiesSpawned++;
    
    renderEnemy(enemy);
    updateWaveProgress();
}

// ===== DÜŞMAN RENDER =====
function renderEnemy(enemy) {
    const cellIdx = enemy.row * COLS + Math.floor(enemy.x);
    if (cellIdx < 0 || cellIdx >= el.gameBoard.children.length) return;
    
    const cell = el.gameBoard.children[cellIdx];
    let div = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
    
    if (!div) {
        div = document.createElement('div');
        let cls = 'enemy';
        if (enemy.isBoss) cls += ' boss';
        else if (enemy.type !== 'normal') cls += ` ${ENEMIES[enemy.type].class}`;
        if (enemy.slowTimer > 0) cls += ' frozen';
        
        div.className = cls;
        div.dataset.enemyId = enemy.id;
        
        const hpBar = document.createElement('div');
        hpBar.className = 'enemy-health-bar';
        const hpFill = document.createElement('div');
        hpFill.className = 'enemy-health-fill';
        hpBar.appendChild(hpFill);
        div.appendChild(hpBar);
        
        cell.appendChild(div);
    } else {
        if (div.parentElement !== cell) cell.appendChild(div);
        
        if (enemy.slowTimer > 0 && !div.classList.contains('frozen')) {
            div.classList.add('frozen');
        } else if (enemy.slowTimer <= 0 && div.classList.contains('frozen')) {
            div.classList.remove('frozen');
        }
    }
    
    const hpFill = div.querySelector('.enemy-health-fill');
    if (hpFill) hpFill.style.width = (enemy.hp / enemy.maxHP * 100) + '%';
}

// ===== DÜŞMANLARI GÜNCELLE =====
function updateEnemies(dt) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const e = gameState.enemies[i];
        
        if (e.slowTimer > 0) {
            e.slowTimer -= dt;
            if (e.slowTimer <= 0) e.speed = e.baseSpeed;
        }
        
        const speedMult = gameState.activeEffects.freeze ? 0.1 : 1;
        e.x -= e.speed * dt * speedMult;
        
        // Healer
        if (e.type === 'healer') {
            e.healTimer += dt;
            if (e.healTimer >= ENEMIES.healer.healInt) {
                e.healTimer = 0;
                gameState.enemies.forEach(other => {
                    if (other !== e && other.row === e.row && Math.abs(other.x - e.x) < 2) {
                        other.hp = Math.min(other.maxHP, other.hp + ENEMIES.healer.healAmt);
                    }
                });
            }
        }
        
        // Bitiş
        if (e.x <= -0.5) {
            gameState.lives--;
            gameState.combo = 0;
            removeEnemy(e, i);
            updateUI();
            showFloatingNumber(el.gameBoard.children[e.row * COLS], '-1 ❤️', 'damage');
            
            if (gameState.lives <= 0) {
                endGame();
                return;
            }
            continue;
        }
        
        renderEnemy(e);
    }
    
    cleanupEnemyVisuals();
}

// ===== DÜŞMAN KALDIR =====
function removeEnemy(enemy, idx) {
    const div = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
    if (div) div.remove();
    gameState.enemies.splice(idx, 1);
}

// ===== GÖRSEL TEMİZLE =====
function cleanupEnemyVisuals() {
    document.querySelectorAll('.enemy').forEach(div => {
        const id = parseFloat(div.dataset.enemyId);
        if (!gameState.enemies.some(e => e.id === id)) div.remove();
    });
}

// ===== KULELERİ GÜNCELLE =====
function updateTowers(dt) {
    gameState.towers.forEach(tower => {
        tower.cooldown = Math.max(0, tower.cooldown - dt);
        
        if (tower.cooldown <= 0) {
            const target = findTarget(tower);
            if (target) {
                if (tower.range === 'laser') {
                    dealLaserDamage(tower, target, dt);
                    showLaserBeam(tower, target);
                } else {
                    shoot(tower, target);
                }
                tower.cooldown = tower.cooldownTime;
            }
        }
    });
}

// ===== HEDEF BUL =====
function findTarget(tower) {
    let targets = [];
    
    switch (tower.range) {
        case 'row':
        case 'splash':
        case 'freeze':
            targets = gameState.enemies.filter(e => e.row === tower.row && e.x <= tower.col);
            break;
        case 'all':
        case 'laser':
            targets = gameState.enemies.filter(e => e.row === tower.row);
            break;
    }
    
    if (!targets.length) return null;
    
    let closest = null, minDist = Infinity;
    targets.forEach(e => {
        const d = Math.abs(e.x - tower.col);
        if (d < minDist) { minDist = d; closest = e; }
    });
    
    return closest;
}

// ===== ATEŞ ET =====
function shoot(tower, target) {
    const dmgMult = gameState.activeEffects.doubleDamage ? 2 : 1;
    
    gameState.bullets.push({
        x: tower.col, y: tower.row,
        targetX: target.x, targetY: target.row,
        targetId: target.id,
        progress: 0,
        damage: tower.damage * dmgMult,
        isSplash: tower.range === 'splash',
        isFreeze: tower.range === 'freeze',
        slow: tower.slow || 0
    });
    
    AudioManager.playSound('shoot');
}

// ===== LAZER HASARI =====
function dealLaserDamage(tower, target, dt) {
    const dmgMult = gameState.activeEffects.doubleDamage ? 2 : 1;
    damageEnemy(target, (tower.damage * dt / 100) * dmgMult);
}

// ===== LAZER IŞINI GÖSTER =====
function showLaserBeam(tower, target) {
    const towerIdx = tower.row * COLS + tower.col;
    const towerCell = el.gameBoard.children[towerIdx];
    const targetIdx = target.row * COLS + Math.floor(target.x);
    const targetCell = el.gameBoard.children[targetIdx];
    
    if (!towerCell || !targetCell) return;
    
    // Basit görsel efekt
    const existing = towerCell.querySelector('.laser-beam');
    if (!existing) {
        const beam = document.createElement('div');
        beam.className = 'laser-beam';
        beam.style.width = '100%';
        beam.style.left = '50%';
        beam.style.top = '50%';
        towerCell.appendChild(beam);
        setTimeout(() => beam.remove(), 100);
    }
}

// ===== MERMİLERİ GÜNCELLE =====
function updateBullets(dt) {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.progress += BULLET_SPEED * dt;
        
        if (b.progress >= 1) {
            const target = gameState.enemies.find(e => e.id === b.targetId);
            
            if (target) {
                if (b.isSplash) {
                    createExplosion(target.row, Math.floor(target.x));
                    AudioManager.playSound('explosion');
                    gameState.enemies.forEach(e => {
                        if (e.row === target.row && Math.abs(e.x - target.x) <= 1.5) {
                            damageEnemy(e, b.damage);
                        }
                    });
                } else if (b.isFreeze) {
                    createFreezeEffect(target.row, Math.floor(target.x));
                    AudioManager.playSound('freeze');
                    gameState.enemies.forEach(e => {
                        if (e.row === target.row && Math.abs(e.x - target.x) <= 1) {
                            e.slowTimer = 2500;
                            e.speed = e.baseSpeed * (1 - b.slow);
                        }
                    });
                    damageEnemy(target, b.damage);
                } else {
                    damageEnemy(target, b.damage);
                }
            }
            
            gameState.bullets.splice(i, 1);
        }
    }
}

// ===== DÜŞMANA HASAR VER =====
function damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    AudioManager.playSound('hit');
    
    if (enemy.hp <= 0) {
        // Combo
        gameState.combo++;
        gameState.comboTimer = COMBO_TIMEOUT;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
        
        // Combo bonus
        const comboBonus = Math.floor(gameState.combo / 3);
        const scoreGain = (enemy.isBoss ? 50 : 10) + comboBonus * 5;
        
        gameState.score += scoreGain;
        gameState.energy += enemy.reward;
        gameState.enemiesKilled++;
        gameState.waveEnemiesKilled++;
        
        // Combo göster
        if (gameState.combo >= 3) {
            showCombo(gameState.combo);
            AudioManager.playSound('combo');
        }
        
        const idx = gameState.enemies.indexOf(enemy);
        if (idx !== -1) {
            const div = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
            if (div) {
                createParticles(div.parentElement, enemy.isBoss ? '#ff00ff' : '#ff4444', 6);
                div.remove();
            }
            gameState.enemies.splice(idx, 1);
        }
        
        // Floating number
        const cellIdx = enemy.row * COLS + Math.max(0, Math.floor(enemy.x));
        if (cellIdx < el.gameBoard.children.length) {
            showFloatingNumber(el.gameBoard.children[cellIdx], `+${scoreGain}`, 'gold');
        }
        
        AudioManager.playSound('kill');
        updateUI();
        updateWaveProgress();
        
        if (enemy.isBoss) AchievementManager.unlock('boss_kill');
        AchievementManager.check(gameState);
    } else {
        renderEnemy(enemy);
    }
}

// ===== COMBO GÖSTER =====
function showCombo(count) {
    el.comboCount.textContent = `x${count}`;
    el.comboDisplay.classList.remove('hidden');
    
    setTimeout(() => el.comboDisplay.classList.add('hidden'), 1000);
}

// ===== PATLAMA EFEKTİ =====
function createExplosion(row, col) {
    const idx = row * COLS + col;
    if (idx < 0 || idx >= el.gameBoard.children.length) return;
    
    const cell = el.gameBoard.children[idx];
    const exp = document.createElement('div');
    exp.className = 'explosion';
    cell.appendChild(exp);
    setTimeout(() => exp.remove(), 400);
}

// ===== FREEZE EFEKTİ =====
function createFreezeEffect(row, col) {
    const idx = row * COLS + col;
    if (idx < 0 || idx >= el.gameBoard.children.length) return;
    
    const cell = el.gameBoard.children[idx];
    const eff = document.createElement('div');
    eff.className = 'freeze-effect';
    cell.appendChild(eff);
    setTimeout(() => eff.remove(), 400);
}

// ===== PARÇACIK EFEKTİ =====
function createParticles(element, color, count) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = color;
        p.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 30) + 'px';
        p.style.top = (rect.top + rect.height / 2 + (Math.random() - 0.5) * 30) + 'px';
        el.particles.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// ===== FLOATING NUMBER =====
function showFloatingNumber(element, text, type) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    
    const num = document.createElement('div');
    num.className = `floating-number ${type}`;
    num.textContent = text;
    num.style.left = (rect.left + rect.width / 2) + 'px';
    num.style.top = rect.top + 'px';
    el.floatingNumbers.appendChild(num);
    setTimeout(() => num.remove(), 1000);
}

// ===== UI GÜNCELLE =====
function updateUI() {
    el.score.textContent = gameState.score;
    el.wave.textContent = gameState.wave;
    el.lives.textContent = gameState.lives;
    el.energy.textContent = Math.floor(gameState.energy);
    
    $('nukeCount').textContent = gameState.powerups.nuke;
    $('freezeCount').textContent = gameState.powerups.freeze;
    $('doubleDamageCount').textContent = gameState.powerups.doubleDamage;
    $('healCount').textContent = gameState.powerups.heal;
    
    $$('.powerup-btn').forEach(btn => {
        btn.disabled = gameState.powerups[btn.dataset.powerup] <= 0;
    });
    
    // Aktif efektler
    updateActiveEffects();
}

// ===== AKTİF EFEKTLER =====
function updateActiveEffects() {
    const effects = [];
    const now = Date.now();
    
    if (gameState.activeEffects.doubleDamage && gameState.effectEndTimes.doubleDamage > now) {
        const remaining = Math.ceil((gameState.effectEndTimes.doubleDamage - now) / 1000);
        effects.push(`⚔️ 2x Hasar (${remaining}s)`);
    }
    if (gameState.activeEffects.freeze && gameState.effectEndTimes.freeze > now) {
        const remaining = Math.ceil((gameState.effectEndTimes.freeze - now) / 1000);
        effects.push(`❄️ Dondur (${remaining}s)`);
    }
    
    el.activeEffects.innerHTML = effects.map(e => `<span class="active-effect">${e}</span>`).join('');
}

// ===== DALGA İLERLEMESİ =====
function updateWaveProgress() {
    const killed = gameState.waveEnemiesKilled;
    const total = gameState.waveEnemyCount;
    el.waveProgress.textContent = `Düşman: ${killed}/${total}`;
    el.waveProgressFill.style.width = (killed / total * 100) + '%';
}

// ===== POWER-UP KULLAN =====
function usePowerup(type) {
    if (gameState.powerups[type] <= 0 || !gameState.isRunning || gameState.isPaused) return;
    
    gameState.powerups[type]--;
    AudioManager.playSound('powerup');
    
    switch (type) {
        case 'nuke':
            gameState.enemies.forEach(e => {
                gameState.score += e.isBoss ? 50 : 10;
                gameState.enemiesKilled++;
                gameState.waveEnemiesKilled++;
            });
            document.querySelectorAll('.enemy').forEach(e => e.remove());
            gameState.enemies = [];
            showNotification('💣 NÜKLEER PATLAMA!', 'success');
            updateWaveProgress();
            break;
            
        case 'freeze':
            gameState.activeEffects.freeze = true;
            gameState.effectEndTimes.freeze = Date.now() + 5000;
            clearTimeout(gameState.effectTimers.freeze);
            gameState.effectTimers.freeze = setTimeout(() => {
                gameState.activeEffects.freeze = false;
            }, 5000);
            showNotification('❄️ Düşmanlar dondu!', 'success');
            break;
            
        case 'doubleDamage':
            gameState.activeEffects.doubleDamage = true;
            gameState.effectEndTimes.doubleDamage = Date.now() + 10000;
            clearTimeout(gameState.effectTimers.doubleDamage);
            gameState.effectTimers.doubleDamage = setTimeout(() => {
                gameState.activeEffects.doubleDamage = false;
            }, 10000);
            showNotification('⚔️ 2x HASAR AKTİF!', 'success');
            break;
            
        case 'heal':
            gameState.lives = Math.min(gameState.maxLives, gameState.lives + 5);
            showNotification('❤️ +5 Can!', 'success');
            break;
    }
    
    updateUI();
}

// ===== OYUNU BAŞLAT =====
function startGame() {
    const diff = DIFFICULTY[gameState.difficulty];
    
    resetGame();
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.startTime = Date.now();
    gameState.energy = diff.energy;
    gameState.lives = diff.lives;
    gameState.maxLives = diff.lives;
    
    el.mainMenu.classList.add('hidden');
    el.gameContainer.classList.remove('hidden');
    
    startWave(1);
    gameState.lastFrameTime = performance.now();
    gameLoop();
}

// ===== DALGA BAŞLAT =====
function startWave(num) {
    gameState.wave = num;
    gameState.waveEnemyCount = 4 + num * 3;
    gameState.waveEnemiesSpawned = 0;
    gameState.waveEnemiesKilled = 0;
    gameState.isBossWave = num % 5 === 0;
    gameState.enemySpawnInterval = Math.max(500, 1800 - num * 70);
    gameState.waveStartLives = gameState.lives;
    gameState.isWaveTransition = false;
    
    el.nextWaveTimer.classList.add('hidden');
    
    AudioManager.playSound('wave');
    showWaveAnnouncement(num);
    updateUI();
    updateWaveProgress();
}

// ===== DALGA DUYURUSU =====
function showWaveAnnouncement(num) {
    const ann = document.createElement('div');
    ann.className = 'wave-announcement';
    ann.innerHTML = gameState.isBossWave ? 
        `⚔️ DALGA ${num} - <span style="color:#ff00ff">BOSS!</span> ⚔️` : 
        `🌊 DALGA ${num}`;
    document.body.appendChild(ann);
    setTimeout(() => ann.remove(), 2000);
}

// ===== OYUNU DURAKLAT =====
function pauseGame() {
    if (!gameState.isRunning) return;
    gameState.isPaused = true;
    $('pauseScore').textContent = gameState.score;
    $('pauseWave').textContent = gameState.wave;
    el.pauseModal.classList.add('show');
}

// ===== DEVAM ET =====
function resumeGame() {
    gameState.isPaused = false;
    el.pauseModal.classList.remove('show');
    gameState.lastFrameTime = performance.now();
    gameLoop();
}

// ===== OYUNU SIFIRLA =====
function resetGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.wave = 0;
    gameState.lives = 10;
    gameState.energy = 100;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.bullets = [];
    gameState.enemySpawnTimer = 0;
    gameState.waveEnemyCount = 0;
    gameState.waveEnemiesSpawned = 0;
    gameState.waveEnemiesKilled = 0;
    gameState.enemiesKilled = 0;
    gameState.towersPlaced = 0;
    gameState.isBossWave = false;
    gameState.usedTowerTypes = new Set();
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.comboTimer = 0;
    gameState.isWaveTransition = false;
    gameState.powerups = { nuke: 1, freeze: 2, doubleDamage: 1, heal: 1 };
    gameState.activeEffects = { doubleDamage: false, freeze: false };
    gameState.effectEndTimes = {};
    
    Object.values(gameState.effectTimers).forEach(t => clearTimeout(t));
    gameState.effectTimers = {};
    
    createGrid();
    updateUI();
    
    el.gameOverModal.classList.remove('show');
    el.victoryModal.classList.remove('show');
    el.pauseModal.classList.remove('show');
    el.upgradeModal.classList.remove('show');
}

// ===== ANA MENÜYE DÖN =====
function returnToMenu() {
    resetGame();
    el.gameContainer.classList.add('hidden');
    el.mainMenu.classList.remove('hidden');
    el.pauseModal.classList.remove('show');
}

// ===== OYUNU BİTİR =====
function endGame() {
    gameState.isRunning = false;
    AudioManager.playSound('gameover');
    
    const isHigh = HighScoreManager.addScore(
        gameState.score, gameState.wave, gameState.difficulty,
        gameState.enemiesKilled, gameState.towersPlaced
    );
    
    $('finalScore').textContent = gameState.score;
    $('finalWave').textContent = gameState.wave;
    $('enemiesKilled').textContent = gameState.enemiesKilled;
    $('towersPlaced').textContent = gameState.towersPlaced;
    
    $('newHighScore').classList.toggle('hidden', !isHigh);
    el.gameOverModal.classList.add('show');
}

// ===== OYUNU KAZAN =====
function winGame() {
    gameState.isRunning = false;
    AudioManager.playSound('victory');
    
    const playTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const mins = Math.floor(playTime / 60);
    const secs = playTime % 60;
    
    const isHigh = HighScoreManager.addScore(
        gameState.score, gameState.wave, gameState.difficulty,
        gameState.enemiesKilled, gameState.towersPlaced
    );
    
    $('victoryScore').textContent = gameState.score;
    $('playTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    $('victoryHighScore').classList.toggle('hidden', !isHigh);
    
    AchievementManager.unlock('wave_10');
    if (gameState.difficulty === 'nightmare') AchievementManager.unlock('nightmare_win');
    
    el.victoryModal.classList.add('show');
}

// ===== ANA OYUN DÖNGÜSÜ =====
function gameLoop(currentTime = 0) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const dt = currentTime - gameState.lastFrameTime;
    gameState.lastFrameTime = currentTime;
    
    // Combo timer
    if (gameState.comboTimer > 0) {
        gameState.comboTimer -= dt;
        if (gameState.comboTimer <= 0) gameState.combo = 0;
    }
    
    // Dalga geçişi
    if (gameState.isWaveTransition) {
        gameState.nextWaveCountdown -= dt;
        el.nextWaveCountdown.textContent = Math.ceil(gameState.nextWaveCountdown / 1000);
        
        if (gameState.nextWaveCountdown <= 0) {
            startWave(gameState.wave + 1);
        }
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Düşman spawn
    if (gameState.waveEnemiesSpawned < gameState.waveEnemyCount) {
        gameState.enemySpawnTimer += dt;
        if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
            spawnEnemy();
            gameState.enemySpawnTimer = 0;
        }
    }
    
    // Dalga tamamlanma
    if (gameState.waveEnemiesSpawned >= gameState.waveEnemyCount && gameState.enemies.length === 0) {
        const diff = DIFFICULTY[gameState.difficulty];
        
        if (gameState.lives === gameState.waveStartLives) {
            AchievementManager.unlock('no_damage');
        }
        
        if (gameState.wave >= diff.waves) {
            winGame();
            return;
        } else {
            // Sonraki dalga için geri sayım
            gameState.isWaveTransition = true;
            gameState.nextWaveCountdown = 3000;
            el.nextWaveTimer.classList.remove('hidden');
        }
    }
    
    updateEnemies(dt);
    if (!gameState.isRunning) return;
    
    updateTowers(dt);
    updateBullets(dt);
    updateActiveEffects();
    
    requestAnimationFrame(gameLoop);
}

// ===== SKOR TABLOSU =====
function showHighScores(difficulty = 'all') {
    const scores = HighScoreManager.getScoresByDifficulty(difficulty);
    const list = $('scoresList');
    
    if (!scores.length) {
        list.innerHTML = '<p class="no-scores">Henüz skor yok</p>';
    } else {
        list.innerHTML = scores.map((s, i) => `
            <div class="score-item">
                <span class="score-rank">${i + 1}.</span>
                <div class="score-details">
                    <div class="score-value">${s.score} puan</div>
                    <div class="score-meta">Dalga ${s.wave} | ${s.difficulty} | ${new Date(s.date).toLocaleDateString('tr-TR')}</div>
                </div>
            </div>
        `).join('');
    }
    
    el.highScoresModal.classList.add('show');
}

// ===== BAŞARIMLAR =====
function showAchievements() {
    const unlocked = AchievementManager.getUnlocked();
    const list = $('achievementsList');
    
    list.innerHTML = AchievementManager.achievements.map(a => `
        <div class="achievement-item ${unlocked.includes(a.id) ? 'unlocked' : ''}">
            <span class="achievement-item-icon">${a.icon}</span>
            <div class="achievement-item-info">
                <div class="achievement-item-name">${a.name}</div>
                <div class="achievement-item-desc">${a.desc}</div>
            </div>
        </div>
    `).join('');
    
    el.achievementsModal.classList.add('show');
}

// ===== EVENT LISTENERS =====
$('playBtn').addEventListener('click', startGame);
$('tutorialBtn').addEventListener('click', () => el.tutorialModal.classList.add('show'));
$('closeTutorialBtn').addEventListener('click', () => el.tutorialModal.classList.remove('show'));
$('pauseBtn').addEventListener('click', pauseGame);
$('helpBtn').addEventListener('click', () => { pauseGame(); el.tutorialModal.classList.add('show'); });
$('menuBtn').addEventListener('click', pauseGame);

$('resumeBtn').addEventListener('click', resumeGame);
$('pauseRestartBtn').addEventListener('click', () => { el.pauseModal.classList.remove('show'); startGame(); });
$('pauseMenuBtn').addEventListener('click', returnToMenu);

$('retryBtn').addEventListener('click', () => { el.gameOverModal.classList.remove('show'); startGame(); });
$('gameOverMenuBtn').addEventListener('click', () => { el.gameOverModal.classList.remove('show'); returnToMenu(); });
$('victoryRetryBtn').addEventListener('click', () => { el.victoryModal.classList.remove('show'); startGame(); });
$('victoryMenuBtn').addEventListener('click', () => { el.victoryModal.classList.remove('show'); returnToMenu(); });
$('cancelUpgradeBtn').addEventListener('click', () => el.upgradeModal.classList.remove('show'));

$('highScoresBtn').addEventListener('click', () => showHighScores('all'));
$('closeScoresBtn').addEventListener('click', () => el.highScoresModal.classList.remove('show'));
$('achievementsBtn').addEventListener('click', showAchievements);
$('closeAchievementsBtn').addEventListener('click', () => el.achievementsModal.classList.remove('show'));

$('musicToggle').addEventListener('click', function() {
    this.classList.toggle('active');
});

$('sfxToggle').addEventListener('click', function() {
    const enabled = AudioManager.toggleSfx();
    this.classList.toggle('active', enabled);
});

// Zorluk seçimi
$$('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.difficulty-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        gameState.difficulty = btn.dataset.difficulty;
    });
});

// Kule seçimi
$$('.tower-type').forEach(el => {
    el.addEventListener('click', () => {
        $$('.tower-type').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        gameState.selectedTowerType = el.dataset.type;
        document.querySelector('.selected-tower-name').textContent = TOWERS[el.dataset.type].name;
    });
    
    el.addEventListener('touchstart', e => { e.preventDefault(); el.click(); }, { passive: false });
});

// Power-up butonları
$$('.powerup-btn').forEach(btn => {
    btn.addEventListener('click', () => usePowerup(btn.dataset.powerup));
    btn.addEventListener('touchstart', e => { e.preventDefault(); usePowerup(btn.dataset.powerup); }, { passive: false });
});

// Skor tabları
$$('.score-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.score-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        showHighScores(tab.dataset.difficulty);
    });
});

// Klavye kısayolları
document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (el.tutorialModal.classList.contains('show')) {
            el.tutorialModal.classList.remove('show');
        } else if (gameState.isRunning && !gameState.isPaused) {
            pauseGame();
        } else if (gameState.isPaused) {
            resumeGame();
        }
    }
    
    if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1;
        const types = $$('.tower-type');
        if (types[idx]) types[idx].click();
    }
    
    if (e.key.toLowerCase() === 'q') usePowerup('nuke');
    if (e.key.toLowerCase() === 'w') usePowerup('freeze');
    if (e.key.toLowerCase() === 'e') usePowerup('doubleDamage');
    if (e.key.toLowerCase() === 'r') usePowerup('heal');
});

// CSS animasyonu ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
`;
document.head.appendChild(style);

// İlk kuleyi seç
$$('.tower-type')[0]?.classList.add('selected');
document.querySelector('.selected-tower-name').textContent = TOWERS.basic.name;

// Başlat
AudioManager.init();
createGrid();
updateUI();
