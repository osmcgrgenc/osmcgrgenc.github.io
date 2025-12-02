/**
 * Cyber Rush 3D - Gelişmiş Endless Runner Oyunu
 * 
 * Özellikler:
 * - CSS 3D Transform ile gerçekçi derinlik efekti
 * - Web Audio API ile ses efektleri
 * - Parçacık efektleri
 * - Combo sistemi
 * - Farklı engel tipleri (normal, uzun, alçak)
 * - Toplanabilir bonus objeler
 * - Kayma mekaniği
 * - Mobil dokunmatik kontroller
 * - High score kaydetme (localStorage)
 */

// ==================== OYUN AYARLARI ====================
const CONFIG = {
    // Şerit ayarları
    laneWidth: 100,
    laneCount: 3, // -1, 0, 1
    
    // Hız ayarları
    baseSpeed: 8,
    maxSpeed: 25,
    speedIncrement: 0.003,
    
    // Fizik
    gravity: 1.2,
    jumpForce: 18,
    
    // Spawn ayarları
    minObstacleGap: 800,
    obstacleSpawnChance: 0.015,
    collectibleSpawnChance: 0.008,
    
    // Mesafeler
    spawnDistance: -1500,
    despawnDistance: 300,
    
    // Puanlama
    pointsPerFrame: 1,
    collectiblePoints: 100,
    comboMultiplierMax: 10
};

// Mobil için ayarları güncelle
function updateConfigForMobile() {
    if (window.innerWidth <= 768) {
        CONFIG.laneWidth = 70;
    } else {
        CONFIG.laneWidth = 100;
    }
}
window.addEventListener('resize', updateConfigForMobile);
updateConfigForMobile();

// ==================== OYUN DURUMU ====================
const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('cyberRushHighScore')) || 0,
    distance: 0,
    speed: CONFIG.baseSpeed,
    combo: 1,
    comboTimer: 0,
    
    // Oyuncu durumu
    player: {
        lane: 0,
        visualX: 0,
        y: 0,
        velocityY: 0,
        isJumping: false,
        isSliding: false,
        slideTimer: 0
    },
    
    // Oyun objeleri
    obstacles: [],
    collectibles: [],
    particles: [],
    
    // Zamanlayıcılar
    lastObstacleZ: CONFIG.spawnDistance
};

// ==================== DOM ELEMANLARI ====================
const DOM = {
    scene: document.getElementById('scene'),
    world: document.getElementById('world'),
    ground: document.getElementById('ground'),
    player: document.getElementById('player'),
    obstaclesContainer: document.getElementById('obstacles-container'),
    collectiblesContainer: document.getElementById('collectibles-container'),
    particlesContainer: document.getElementById('particles-container'),
    
    // UI
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    comboBoard: document.getElementById('combo-board'),
    speedDisplay: document.getElementById('speed-display'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    finalHighScore: document.getElementById('final-high-score'),
    finalDistance: document.getElementById('final-distance'),
    
    // Ekranlar
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    screenFlash: document.getElementById('screen-flash'),
    speedLines: document.getElementById('speed-lines'),
    
    // Butonlar
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    resumeBtn: document.getElementById('resume-btn')
};

// ==================== SES SİSTEMİ ====================
const AudioSystem = {
    context: null,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API desteklenmiyor');
        }
    },
    
    // Basit ses sentezi
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },
    
    // Ses efektleri
    jump() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.15), 50);
    },
    
    collect() {
        this.playTone(800, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.15), 50);
        setTimeout(() => this.playTone(1200, 0.15, 'sine', 0.1), 100);
    },
    
    crash() {
        this.playTone(150, 0.3, 'sawtooth', 0.4);
        this.playTone(100, 0.4, 'square', 0.3);
    },
    
    slide() {
        this.playTone(200, 0.15, 'triangle', 0.15);
    }
};

// ==================== PARTİKÜL SİSTEMİ ====================
const ParticleSystem = {
    create(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            // Rastgele yön
            const angle = (Math.PI * 2 / count) * i;
            const speed = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            DOM.particlesContainer.appendChild(particle);
            
            // Animasyon sonunda kaldır
            setTimeout(() => particle.remove(), 500);
        }
    }
};

// ==================== GİRİŞ SİSTEMİ ====================
const InputSystem = {
    keys: {},
    touchStartX: 0,
    touchStartY: 0,
    
    init() {
        // Klavye
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Dokunmatik
        DOM.scene.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        DOM.scene.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        DOM.scene.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    },
    
    handleKeyDown(e) {
        if (this.keys[e.code]) return; // Tekrar basılmasını engelle
        this.keys[e.code] = true;
        
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                e.preventDefault();
                this.jump();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.slide();
                break;
            case 'Escape':
            case 'KeyP':
                togglePause();
                break;
        }
    },
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.endSlide();
        }
    },
    
    handleTouchStart(e) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    },
    
    handleTouchMove(e) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        e.preventDefault();
    },
    
    handleTouchEnd(e) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        const minSwipe = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Yatay kaydırma
            if (deltaX > minSwipe) this.moveRight();
            else if (deltaX < -minSwipe) this.moveLeft();
        } else {
            // Dikey kaydırma
            if (deltaY < -minSwipe) this.jump();
            else if (deltaY > minSwipe) this.slide();
        }
    },
    
    moveLeft() {
        if (gameState.player.lane > -1) {
            gameState.player.lane--;
        }
    },
    
    moveRight() {
        if (gameState.player.lane < 1) {
            gameState.player.lane++;
        }
    },
    
    jump() {
        if (!gameState.player.isJumping && !gameState.player.isSliding) {
            gameState.player.isJumping = true;
            gameState.player.velocityY = CONFIG.jumpForce;
            DOM.player.classList.add('jumping');
            AudioSystem.jump();
        }
    },
    
    slide() {
        if (!gameState.player.isJumping && !gameState.player.isSliding) {
            gameState.player.isSliding = true;
            gameState.player.slideTimer = 30; // 30 frame
            DOM.player.classList.add('sliding');
            AudioSystem.slide();
        }
    },
    
    endSlide() {
        gameState.player.isSliding = false;
        gameState.player.slideTimer = 0;
        DOM.player.classList.remove('sliding');
    }
};

// ==================== OYUN FONKSİYONLARI ====================

function startGame() {
    // Durumu sıfırla
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.distance = 0;
    gameState.speed = CONFIG.baseSpeed;
    gameState.combo = 1;
    gameState.comboTimer = 0;
    
    gameState.player.lane = 0;
    gameState.player.visualX = 0;
    gameState.player.y = 0;
    gameState.player.velocityY = 0;
    gameState.player.isJumping = false;
    gameState.player.isSliding = false;
    
    gameState.lastObstacleZ = CONFIG.spawnDistance;
    
    // Eski objeleri temizle
    clearGameObjects();
    
    // UI güncelle
    DOM.startScreen.classList.add('hidden');
    DOM.gameOverScreen.classList.add('hidden');
    DOM.highScore.textContent = gameState.highScore;
    updateUI();
    
    // Ses sistemini başlat
    AudioSystem.init();
    
    // Oyun döngüsünü başlat
    requestAnimationFrame(gameLoop);
}

function clearGameObjects() {
    gameState.obstacles.forEach(o => o.element.remove());
    gameState.obstacles = [];
    
    gameState.collectibles.forEach(c => c.element.remove());
    gameState.collectibles = [];
    
    DOM.particlesContainer.innerHTML = '';
}

function gameOver() {
    gameState.isPlaying = false;
    
    // Ses çal
    AudioSystem.crash();
    
    // Ekran efektleri
    DOM.screenFlash.classList.add('flash');
    setTimeout(() => DOM.screenFlash.classList.remove('flash'), 100);
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
    
    // High score güncelle
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('cyberRushHighScore', gameState.highScore);
    }
    
    // UI güncelle
    DOM.finalScore.textContent = gameState.score;
    DOM.finalHighScore.textContent = gameState.highScore;
    DOM.finalDistance.textContent = Math.floor(gameState.distance) + 'm';
    
    // Game over ekranını göster
    setTimeout(() => {
        DOM.gameOverScreen.classList.remove('hidden');
    }, 500);
}

function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    DOM.pauseScreen.classList.toggle('hidden', !gameState.isPaused);
    
    if (!gameState.isPaused) {
        requestAnimationFrame(gameLoop);
    }
}

// ==================== OYUN DÖNGÜSÜ ====================

function gameLoop(timestamp) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Hız artışı
    if (gameState.speed < CONFIG.maxSpeed) {
        gameState.speed += CONFIG.speedIncrement;
    }
    
    // Mesafe ve skor
    gameState.distance += gameState.speed * 0.01;
    gameState.score += Math.floor(CONFIG.pointsPerFrame * gameState.combo);
    
    // Combo zamanlayıcı
    if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer === 0) {
            gameState.combo = 1;
        }
    }
    
    // Güncellemeler
    updatePlayer();
    updateObstacles();
    updateCollectibles();
    spawnObjects();
    checkCollisions();
    updateUI();
    updateVisuals();
    
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    const player = gameState.player;
    
    // Şerit geçişi (lerp)
    const targetX = player.lane * CONFIG.laneWidth;
    player.visualX += (targetX - player.visualX) * 0.2;
    
    // Zıplama fiziği
    if (player.isJumping) {
        player.y += player.velocityY;
        player.velocityY -= CONFIG.gravity;
        
        if (player.y <= 0) {
            player.y = 0;
            player.isJumping = false;
            player.velocityY = 0;
            DOM.player.classList.remove('jumping');
        }
    }
    
    // Kayma zamanlayıcı
    if (player.isSliding) {
        player.slideTimer--;
        if (player.slideTimer <= 0) {
            InputSystem.endSlide();
        }
    }
    
    // Görsel güncelleme
    const centerX = window.innerWidth / 2;
    DOM.player.style.left = (centerX + player.visualX) + 'px';
    DOM.player.style.bottom = (80 + player.y) + 'px';
}

function updateObstacles() {
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.z += gameState.speed;
        
        // Görsel güncelleme
        const scale = getScaleForZ(obs.z);
        const screenX = getScreenXForLane(obs.lane, obs.z);
        const screenY = getScreenYForZ(obs.z);
        
        obs.element.style.left = screenX + 'px';
        obs.element.style.bottom = screenY + 'px';
        obs.element.style.transform = `translateX(-50%) scale(${scale})`;
        obs.element.style.opacity = Math.min(1, (obs.z + 1500) / 500);
        
        // Ekrandan çıkınca kaldır
        if (obs.z > CONFIG.despawnDistance) {
            obs.element.remove();
            gameState.obstacles.splice(i, 1);
        }
    }
}

function updateCollectibles() {
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const col = gameState.collectibles[i];
        col.z += gameState.speed;
        
        const scale = getScaleForZ(col.z);
        const screenX = getScreenXForLane(col.lane, col.z);
        const screenY = getScreenYForZ(col.z) + 30;
        
        col.element.style.left = screenX + 'px';
        col.element.style.bottom = screenY + 'px';
        col.element.style.transform = `translateX(-50%) scale(${scale})`;
        col.element.style.opacity = Math.min(1, (col.z + 1500) / 500);
        
        if (col.z > CONFIG.despawnDistance) {
            col.element.remove();
            gameState.collectibles.splice(i, 1);
        }
    }
}

function spawnObjects() {
    // Engel spawn
    if (Math.random() < CONFIG.obstacleSpawnChance) {
        const lastObs = gameState.obstacles[gameState.obstacles.length - 1];
        if (!lastObs || lastObs.z > CONFIG.spawnDistance + CONFIG.minObstacleGap) {
            spawnObstacle();
        }
    }
    
    // Toplanabilir spawn
    if (Math.random() < CONFIG.collectibleSpawnChance) {
        spawnCollectible();
    }
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3) - 1;
    
    // Engel tipi seç
    const typeRoll = Math.random();
    let type = 'normal';
    if (typeRoll < 0.2) type = 'tall';
    else if (typeRoll < 0.4) type = 'low';
    
    const element = document.createElement('div');
    element.className = `obstacle ${type}`;
    element.innerHTML = `
        <div class="obstacle-box">
            <div class="obstacle-face front"></div>
            <div class="obstacle-face back"></div>
            <div class="obstacle-face left"></div>
            <div class="obstacle-face right"></div>
            <div class="obstacle-face top"></div>
            <div class="obstacle-face bottom"></div>
        </div>
    `;
    
    DOM.obstaclesContainer.appendChild(element);
    
    gameState.obstacles.push({
        element,
        lane,
        z: CONFIG.spawnDistance,
        type,
        passed: false
    });
}

function spawnCollectible() {
    const lane = Math.floor(Math.random() * 3) - 1;
    
    // Aynı yerde engel var mı kontrol et
    const hasObstacle = gameState.obstacles.some(o => 
        o.lane === lane && Math.abs(o.z - CONFIG.spawnDistance) < 200
    );
    if (hasObstacle) return;
    
    const element = document.createElement('div');
    element.className = 'collectible';
    element.innerHTML = '<div class="collectible-inner"></div>';
    
    DOM.collectiblesContainer.appendChild(element);
    
    gameState.collectibles.push({
        element,
        lane,
        z: CONFIG.spawnDistance
    });
}

// ==================== ÇARPIŞMA TESPİTİ ====================

function checkCollisions() {
    const player = gameState.player;
    const playerHitboxWidth = 30;
    const playerHitboxHeight = player.isSliding ? 15 : 35;
    
    // Engel çarpışmaları
    for (const obs of gameState.obstacles) {
        if (obs.z > -50 && obs.z < 50) {
            // X kontrolü
            const obsX = obs.lane * CONFIG.laneWidth;
            const distX = Math.abs(player.visualX - obsX);
            
            if (distX < playerHitboxWidth + 25) {
                // Y kontrolü
                let obsHeight = 60;
                let obsMinY = 0;
                
                if (obs.type === 'tall') {
                    obsHeight = 120;
                } else if (obs.type === 'low') {
                    obsHeight = 30;
                    // Alçak engellerin üzerinden zıplanabilir veya altından kayılabilir
                    if (player.y > 40) continue; // Zıplayarak geçti
                    if (player.isSliding) continue; // Kayarak geçti
                }
                
                // Normal ve uzun engeller için zıplama kontrolü
                if (obs.type !== 'low' && player.y > obsHeight - 10) continue;
                
                // ÇARPIŞMA!
                gameOver();
                return;
            }
        }
    }
    
    // Toplanabilir çarpışmaları
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const col = gameState.collectibles[i];
        
        if (col.z > -40 && col.z < 40) {
            const colX = col.lane * CONFIG.laneWidth;
            const distX = Math.abs(player.visualX - colX);
            
            if (distX < 40 && player.y < 80) {
                // Toplandı!
                collectItem(col, i);
            }
        }
    }
}

function collectItem(collectible, index) {
    // Puan ekle
    gameState.score += CONFIG.collectiblePoints * gameState.combo;
    
    // Combo artır
    gameState.combo = Math.min(gameState.combo + 1, CONFIG.comboMultiplierMax);
    gameState.comboTimer = 120; // 2 saniye
    
    // Efektler
    AudioSystem.collect();
    
    const rect = collectible.element.getBoundingClientRect();
    ParticleSystem.create(rect.left + rect.width/2, rect.top + rect.height/2, '#00ff88', 15);
    
    // Combo UI efekti
    DOM.comboBoard.classList.remove('hidden');
    DOM.comboBoard.classList.add('pop');
    setTimeout(() => DOM.comboBoard.classList.remove('pop'), 100);
    
    // Kaldır
    collectible.element.remove();
    gameState.collectibles.splice(index, 1);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function getScaleForZ(z) {
    // Z mesafesine göre ölçek (perspektif efekti)
    const minScale = 0.1;
    const maxScale = 1.5;
    const normalized = (z + 1500) / 1800;
    return minScale + (maxScale - minScale) * Math.pow(normalized, 0.8);
}

function getScreenXForLane(lane, z) {
    // Perspektif ile X pozisyonu
    const centerX = window.innerWidth / 2;
    const scale = getScaleForZ(z);
    return centerX + (lane * CONFIG.laneWidth * scale);
}

function getScreenYForZ(z) {
    // Z'ye göre ekran Y pozisyonu
    const minY = 80;
    const maxY = window.innerHeight * 0.5;
    const normalized = (z + 1500) / 1800;
    return minY + (maxY - minY) * (1 - normalized);
}

function updateUI() {
    DOM.score.textContent = gameState.score;
    DOM.combo.textContent = 'x' + gameState.combo;
    DOM.speedDisplay.textContent = (gameState.speed / CONFIG.baseSpeed).toFixed(1) + 'x';
    
    if (gameState.combo <= 1) {
        DOM.comboBoard.classList.add('hidden');
    }
}

function updateVisuals() {
    // Zemin animasyon hızı
    const groundDuration = Math.max(0.1, 0.5 / (gameState.speed / CONFIG.baseSpeed));
    DOM.ground.style.animationDuration = groundDuration + 's';
    
    const laneLines = document.querySelectorAll('.lane-line');
    laneLines.forEach(line => {
        line.style.animationDuration = groundDuration + 's';
    });
    
    // Hız çizgileri (yüksek hızda)
    if (gameState.speed > CONFIG.baseSpeed * 1.5) {
        DOM.speedLines.classList.remove('hidden');
    } else {
        DOM.speedLines.classList.add('hidden');
    }
}

// ==================== OLAY DİNLEYİCİLERİ ====================

DOM.startBtn.addEventListener('click', startGame);
DOM.restartBtn.addEventListener('click', startGame);
DOM.resumeBtn.addEventListener('click', togglePause);

// High score'u göster
DOM.highScore.textContent = gameState.highScore;

// Input sistemini başlat
InputSystem.init();
