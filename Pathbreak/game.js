// Ana oyun dosyası
import GameState from './core/state.js';
import GameLoop from './core/gameLoop.js';
import MapSystem from './core/map.js';
import Enemy from './entities/Enemy.js';
import Boss from './entities/Boss.js';
import Tower from './entities/Tower.js';
import ProjectilePool from './entities/Projectile.js';
import WaveSystem from './systems/WaveSystem.js';
import EconomySystem from './systems/EconomySystem.js';
import ArtifactSystem from './systems/ArtifactSystem.js';
import ProgressSystem from './systems/ProgressSystem.js';
import ParticleSystem from './systems/ParticleSystem.js';
import DamageNumbers from './systems/DamageNumbers.js';
import TouchControls from './core/touchControls.js';
import HUD from './ui/hud.js';
import PanelManager from './ui/panels.js';
import ArtifactUI from './ui/artifactUI.js';

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Sistemler
        this.state = new GameState();
        this.map = new MapSystem(this.canvas.width, this.canvas.height, 'default');
        this.waveSystem = new WaveSystem();
        this.economy = new EconomySystem();
        this.artifactSystem = new ArtifactSystem();
        this.progressSystem = new ProgressSystem();
        this.particleSystem = new ParticleSystem();
        this.damageNumbers = new DamageNumbers();
        this.projectilePool = new ProjectilePool();
        
        // UI
        this.hud = new HUD();
        this.panels = new PanelManager();
        this.artifactUI = new ArtifactUI();
        
        // Oyun durumu
        this.waveStartTime = 0;
        this.lastTime = performance.now();
        
        // Event listener'lar
        this.setupEventListeners();
        
        // State listener
        this.state.subscribe((oldState, newState) => {
            this.onStateChange(oldState, newState);
        });
        
        // Touch kontrolleri (mobil için)
        this.touchControls = new TouchControls(this.canvas, this);
        
        // Mobil cihaz kontrolü
        this.isMobile = this.detectMobile();
        this.frameSkip = false; // Render skip için
        if (this.isMobile) {
            this.setupMobileOptimizations();
        }
        
        // İlk render
        this.render();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }
    
    setupMobileOptimizations() {
        // Viewport meta tag kontrolü
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Canvas optimizasyonları
        this.canvas.style.touchAction = 'none';
        
        // Mobil UI ayarları
        document.body.classList.add('mobile-device');
    }
    
    resizeCanvas() {
        const gameArea = document.getElementById('game-area');
        const rightPanel = document.getElementById('right-panel');
        const rightPanelWidth = rightPanel.offsetWidth;
        const availableWidth = gameArea.offsetWidth - rightPanelWidth;
        const availableHeight = gameArea.offsetHeight;
        
        this.canvas.width = availableWidth;
        this.canvas.height = availableHeight;
        
        // Haritayı yeniden oluştur
        if (this.map) {
            const currentMapType = this.map.getMapType();
            this.map = new MapSystem(this.canvas.width, this.canvas.height, currentMapType);
        }
    }
    
    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Canvas hover
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasHover(e);
        });
        
        // HUD events
        this.hud.onStart(() => this.startGame());
        this.hud.onPause(() => this.pauseGame());
        this.hud.onReady(() => this.startWave());
        this.hud.onPanic(() => this.usePanicToken());
        this.hud.onRestart(() => this.restartGame());
        
        // Artifact UI events
        this.artifactUI.setOnArtifactSelected((artifact) => {
            this.selectArtifact(artifact);
        });
        
        // Panel events
        this.panels.setOnTowerTypeSelected((type) => {
            this.state.update('placementMode', type);
            if (!type) {
                this.canvas.classList.remove('placement-mode');
            } else {
                this.canvas.classList.add('placement-mode');
            }
        });
        
        this.panels.setUpgradeCallback((tower) => {
            this.upgradeTower(tower);
        });
        
        this.panels.setSellCallback((tower) => {
            this.sellTower(tower);
        });
        
        // Hız kontrolü
        this.hud.elements.speed1x.addEventListener('click', () => {
            this.state.update('gameSpeed', 1);
            if (this.gameLoop) {
                this.gameLoop.setSpeed(1);
            }
        });
        
        this.hud.elements.speed2x.addEventListener('click', () => {
            this.state.update('gameSpeed', 2);
            if (this.gameLoop) {
                this.gameLoop.setSpeed(2);
            }
        });
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const state = this.state.getState();
        
        // Kule yerleştirme modu
        if (state.placementMode) {
            this.placeTower(x, y, state.placementMode);
            return;
        }
        
        // Kule seçimi
        let clickedTower = null;
        let minDist = Infinity;
        
        for (const tower of state.towers) {
            const dx = tower.position.x - x;
            const dy = tower.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < tower.radius && dist < minDist) {
                clickedTower = tower;
                minDist = dist;
            }
        }
        
        if (clickedTower) {
            this.selectTower(clickedTower);
        } else {
            this.deselectTower();
        }
    }
    
    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.state.update('hoveredTile', { x, y });
    }
    
    placeTower(x, y, towerType) {
        const state = this.state.getState();
        
        // Yerleştirme kontrolü
        if (!this.map.canPlaceTower(x, y, state.towers)) {
            return;
        }
        
        // Ekonomi kontrolü
        const cost = this.economy.towerCosts[towerType];
        if (!this.economy.canAffordTower(state.gold, towerType)) {
            return;
        }
        
        // Kule oluştur
        const tower = new Tower(towerType, x, y);
        const result = this.economy.buyTower(state.gold, towerType);
        
        if (result.success) {
            // Artifact efektlerini yeni kuleye uygula
            this.applyArtifactEffectsToTower(tower);
            
            const newTowers = [...state.towers, tower];
            this.state.setState({
                towers: newTowers,
                gold: result.newGold,
                placementMode: null
            });
            
            this.canvas.classList.remove('placement-mode');
            this.panels.deselectTowerType();
        }
    }
    
    applyArtifactEffectsToTower(tower) {
        const modifications = this.artifactSystem.applyArtifactEffects(tower, {});
        
        // Menzil bonusu
        if (modifications.rangeMultiplier !== 1) {
            const baseRange = Tower.getStats(tower.type).range;
            tower.range = Math.floor(baseRange * modifications.rangeMultiplier);
        }
        
        // Atış hızı bonusu
        if (modifications.fireRateMultiplier !== 1) {
            const baseFireRate = Tower.getStats(tower.type).fireRate;
            tower.fireRate = Math.floor(baseFireRate * modifications.fireRateMultiplier);
        }
        
        // Kritik şans bonusu
        if (modifications.critChanceBonus > 0 && tower.critChance !== undefined) {
            tower.critChance += modifications.critChanceBonus;
        }
        
        // Zırh delme bonusu
        if (modifications.armorPenetrationMultiplier !== 1 && tower.armorPenetration !== undefined) {
            tower.armorPenetration = Math.floor(tower.armorPenetration * modifications.armorPenetrationMultiplier);
        }
    }
    
    selectTower(tower) {
        this.state.update('selectedTower', tower);
        this.panels.showTowerInfo(tower, this.state.get('gold'));
    }
    
    deselectTower() {
        this.state.update('selectedTower', null);
        this.panels.hideTowerInfo();
    }
    
    upgradeTower(tower) {
        const state = this.state.getState();
        
        if (tower.level >= tower.maxLevel) return;
        
        // Artifact: Yükseltme maliyeti azaltma
        const modifications = this.artifactSystem.applyArtifactEffects(null, {});
        const baseResult = this.economy.upgradeTower(state.gold, tower.type, tower.level);
        
        if (baseResult.success) {
            // Artifact çarpanını uygula
            const finalCost = Math.floor(baseResult.cost * modifications.upgradeCostMultiplier);
            const finalGold = state.gold - finalCost;
            
            if (finalGold >= 0) {
                tower.upgrade();
                this.state.update('gold', finalGold);
                this.panels.updateGold(finalGold);
                this.panels.showTowerInfo(tower, finalGold);
            }
        }
    }
    
    sellTower(tower) {
        const state = this.state.getState();
        const sellValue = this.economy.sellTower(tower);
        
        const newTowers = state.towers.filter(t => t !== tower);
        this.state.setState({
            towers: newTowers,
            gold: state.gold + sellValue,
            selectedTower: null
        });
        
        this.panels.hideTowerInfo();
    }
    
    startGame() {
        // Run başında artifact seçimi
        this.showArtifactSelection();
    }
    
    showArtifactSelection() {
        const artifacts = this.artifactSystem.getRandomArtifacts();
        this.artifactUI.showArtifactSelection(artifacts);
        this.state.update('gameState', 'artifactSelection');
    }
    
    selectArtifact(artifact) {
        this.artifactSystem.addArtifact(artifact);
        this.artifactUI.hideArtifactSelection();
        this.artifactUI.updateActiveArtifacts(this.artifactSystem.getActiveArtifacts());
        
        // Artifact efektlerini uygula (başlangıç canı, vb.)
        this.applyArtifactEffects();
        
        // Hazırlık ekranına geç
        this.state.setState({
            gameState: 'preparation',
            wave: 1
        });
        
        this.showPreparationScreen();
    }
    
    applyArtifactEffects() {
        const state = this.state.getState();
        const artifacts = this.artifactSystem.getActiveArtifacts();
        
        // Başlangıç canı bonusu
        let healthBonus = 0;
        for (const artifact of artifacts) {
            if (artifact.effect.type === 'starting_health_bonus') {
                healthBonus += artifact.effect.value;
            }
        }
        
        if (healthBonus > 0) {
            this.state.update('health', state.health + healthBonus);
        }
        
        // Mevcut kulelere artifact efektlerini uygula
        this.updateTowersWithArtifacts();
    }
    
    updateTowersWithArtifacts() {
        const state = this.state.getState();
        const modifications = this.artifactSystem.applyArtifactEffects(null, {});
        
        for (const tower of state.towers) {
            // Menzil bonusu
            if (modifications.rangeMultiplier !== 1) {
                const baseRange = Tower.getStats(tower.type).range;
                tower.range = Math.floor(baseRange * modifications.rangeMultiplier);
            }
            
            // Atış hızı bonusu
            if (modifications.fireRateMultiplier !== 1) {
                const baseFireRate = Tower.getStats(tower.type).fireRate;
                tower.fireRate = Math.floor(baseFireRate * modifications.fireRateMultiplier);
            }
            
            // Kritik şans bonusu
            if (modifications.critChanceBonus > 0 && tower.critChance !== undefined) {
                tower.critChance += modifications.critChanceBonus;
            }
            
            // Zırh delme bonusu
            if (modifications.armorPenetrationMultiplier !== 1 && tower.armorPenetration !== undefined) {
                tower.armorPenetration = Math.floor(tower.armorPenetration * modifications.armorPenetrationMultiplier);
            }
        }
    }
    
    startWave() {
        const state = this.state.getState();
        const wave = this.waveSystem.startWave(state.wave);
        
        if (!wave) {
            // Tüm dalgalar tamamlandı
            this.victory();
            return;
        }
        
        this.state.setState({
            gameState: 'playing',
            currentWave: wave,
            waveInProgress: true
        });
        
        this.waveStartTime = performance.now();
        this.hud.hidePreparationScreen();
        
        if (!this.gameLoop) {
            this.gameLoop = new GameLoop(
                (deltaTime) => this.update(deltaTime),
                () => this.render()
            );
            this.gameLoop.setSpeed(state.gameSpeed);
            this.gameLoop.start();
        }
    }
    
    pauseGame() {
        this.state.update('gameState', 'paused');
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
    }
    
    showPreparationScreen() {
        const state = this.state.getState();
        const nextWaveInfo = this.waveSystem.getNextWaveInfo(state.wave - 1);
        this.hud.showPreparationScreen(nextWaveInfo);
    }
    
    usePanicToken() {
        const state = this.state.getState();
        
        if (state.panicTokens <= 0 || state.gameState !== 'playing') {
            return;
        }
        
        // Tüm düşmanları öldür
        const newEnemies = state.enemies.filter(enemy => {
            return false; // Tümünü kaldır
        });
        
        this.state.setState({
            enemies: newEnemies,
            panicTokens: state.panicTokens - 1,
            score: Math.max(0, state.score - 100) // Skor cezası
        });
    }
    
    restartGame() {
        this.state.reset();
        this.artifactSystem.reset();
        this.artifactUI.updateActiveArtifacts([]);
        this.hud.hideGameOverScreen();
        this.panels.hideTowerInfo();
        this.panels.deselectTowerType();
        this.hideScoreboard();
        
        // Unlock'ları güncelle
        this.updateTowerUnlocks();
        
        if (this.gameLoop) {
            this.gameLoop.stop();
            this.gameLoop = null;
        }
        
        this.render();
    }
    
    victory() {
        const state = this.state.getState();
        this.state.update('gameState', 'gameOver');
        
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // İstatistikleri kaydet
        const enemiesKilled = state.enemies.filter(e => e.isDead()).length;
        this.progressSystem.updateRunStats(state.wave, enemiesKilled);
        
        // Skor kaydet
        const artifacts = this.artifactSystem.getActiveArtifacts();
        this.progressSystem.addScore(state.score, state.wave, artifacts);
        
        // Achievement kontrolü
        const newAchievements = this.progressSystem.checkAchievements(state.score, state.wave);
        if (newAchievements.length > 0) {
            // İlk achievement'i göster
            setTimeout(() => {
                this.showAchievement(newAchievements[0]);
            }, 1000);
        }
        
        this.hud.showGameOverScreen(true, state.score, state.wave);
    }
    
    gameOver() {
        const state = this.state.getState();
        this.state.update('gameState', 'gameOver');
        
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        this.hud.showGameOverScreen(false, state.score, state.wave);
    }
    
    update(deltaTime) {
        const state = this.state.getState();
        
        if (state.gameState !== 'playing') return;
        
        const currentTime = performance.now();
        const waveTime = (currentTime - this.waveStartTime);
        
        // Düşman spawn
        if (state.currentWave && state.waveInProgress) {
            const spawned = this.waveSystem.spawnEnemies(
                state.currentWave,
                waveTime,
                this.map.getActivePath()
            );
            
            if (spawned.length > 0) {
                const newEnemies = spawned.map(spawn => {
                    if (spawn.type === 'boss') {
                        return new Boss(spawn.path, spawn.startIndex || 0);
                    } else {
                        return new Enemy(spawn.type, spawn.path, spawn.startIndex || 0);
                    }
                });
                
                this.state.update('enemies', [...state.enemies, ...newEnemies]);
            }
            
            // Dalga tamamlandı mı?
            if (this.waveSystem.isWaveComplete(state.currentWave, state.enemies)) {
                this.completeWave();
            }
        }
        
        // Düşmanları güncelle
        const newEnemies = [];
        let healthLost = 0;
        const summonedEnemies = [];
        
        for (const enemy of state.enemies) {
            enemy.update(deltaTime);
            
            // Boss summon kontrolü
            if (enemy instanceof Boss && enemy.canSummon(currentTime)) {
                const summoned = enemy.summonEnemies(this.map.getActivePath());
                if (summoned.length > 0) {
                    const newSummoned = summoned.map(spawn => {
                        return new Enemy(spawn.type, spawn.path, spawn.startIndex);
                    });
                    summonedEnemies.push(...newSummoned);
                }
            }
            
            if (enemy.reachedEnd) {
                healthLost++;
            } else if (!enemy.isDead()) {
                newEnemies.push(enemy);
            }
        }
        
        // Summon edilen düşmanları ekle
        if (summonedEnemies.length > 0) {
            newEnemies.push(...summonedEnemies);
        }
        
        // Can kaybı
        if (healthLost > 0) {
            const newHealth = state.health - healthLost;
            this.state.update('health', newHealth);
            
            if (newHealth <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Öldürülen düşmanlar için altın
        const killedCount = state.enemies.length - newEnemies.length - healthLost;
        if (killedCount > 0) {
            let goldGained = 0;
            for (const enemy of state.enemies) {
                if (enemy.isDead() && !enemy.rewardCollected) {
                    goldGained += this.economy.getEnemyReward(enemy.type);
                    enemy.rewardCollected = true;
                }
            }
            
            if (goldGained > 0) {
                // Artifact: Altın çarpanı
                const modifications = this.artifactSystem.applyArtifactEffects(null, {});
                const finalGold = Math.floor(goldGained * modifications.goldMultiplier);
                
                this.state.update('gold', state.gold + finalGold);
                this.state.update('score', state.score + finalGold);
            }
        }
        
        // Artifact: Death explosion kontrolü
        const killedEnemies = state.enemies.filter(e => e.isDead() && !e.rewardCollected);
        for (const enemy of killedEnemies) {
            // Ölüm partikül efekti
            this.particleSystem.createParticle(enemy.position.x, enemy.position.y, 'explosion');
            
            const explosionResults = this.artifactSystem.checkSpecialEffects('enemy_killed', { enemy });
            for (const result of explosionResults) {
                if (result.type === 'explosion') {
                    // Patlama partikül efekti
                    this.particleSystem.createParticle(result.position.x, result.position.y, 'explosion');
                    
                    // Patlama hasarı uygula
                    for (const otherEnemy of newEnemies) {
                        const dx = otherEnemy.position.x - result.position.x;
                        const dy = otherEnemy.position.y - result.position.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist <= result.radius) {
                            otherEnemy.takeDamage(result.damage, 'physical');
                        }
                    }
                }
            }
        }
        
        // Partikül sistemi güncelle
        this.particleSystem.update(deltaTime);
        
        // Hasar sayıları güncelle
        this.damageNumbers.update(deltaTime);
        
        this.state.update('enemies', newEnemies);
        
        // Kuleler (güncel enemy listesi ile)
        const currentEnemyList = this.state.get('enemies');
        for (const tower of state.towers) {
            // Tower animasyonlarını güncelle
            if (tower.update) {
                tower.update(deltaTime);
            }
            tower.findTarget(currentEnemyList);
            
            if (tower.target && tower.canFire(currentTime)) {
                // Artifact: Tower synergy kontrolü
                const synergyResults = this.artifactSystem.checkSpecialEffects('tower_damage', {
                    tower,
                    towers: state.towers
                });
                
                let damageMultiplier = 1;
                for (const result of synergyResults) {
                    if (result.type === 'synergy_bonus') {
                        damageMultiplier *= result.multiplier;
                    }
                }
                
                const projectile = tower.fire(currentTime);
                if (projectile) {
                    // Synergy bonusunu uygula
                    if (damageMultiplier > 1) {
                        projectile.damage = Math.floor(projectile.damage * damageMultiplier);
                    }
                    
                    this.projectilePool.create(
                        projectile.x,
                        projectile.y,
                        projectile.target,
                        projectile.damage,
                        projectile.damageType,
                        projectile.speed,
                        projectile.color,
                        tower
                    );
                }
            }
        }
        
        // Mermileri güncelle ve AoE hasar için bilgi topla
        const aoeHits = [];
        const currentEnemies = [...state.enemies]; // Snapshot
        
        // Aktif mermileri kontrol et ve güncelle
        for (let i = this.projectilePool.active.length - 1; i >= 0; i--) {
            const projectile = this.projectilePool.active[i];
            if (!projectile.active || !projectile.target) {
                this.projectilePool.remove(projectile);
                continue;
            }
            
            // Hedef öldü mü kontrol et
            if (projectile.target.isDead() || projectile.target.reachedEnd) {
                this.projectilePool.remove(projectile);
                continue;
            }
            
            const dx = projectile.target.position.x - projectile.x;
            const dy = projectile.target.position.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.target.radius) {
                // Artifact: Frozen damage multiplier
                const modifications = this.artifactSystem.applyArtifactEffects(projectile.tower, {
                    enemy: projectile.target
                });
                
                // Vuruş yap
                const hitResult = this.projectilePool.hit(projectile);
                
                // Hasar sayısı göster
                if (hitResult) {
                    this.damageNumbers.addDamage(
                        projectile.target.position.x,
                        projectile.target.position.y,
                        hitResult.damage,
                        projectile.isCrit,
                        projectile.damageType === 'magic'
                    );
                }
                
                // Partikül efekti
                if (hitResult) {
                    if (projectile.isCrit) {
                        this.particleSystem.createParticle(projectile.x, projectile.y, 'crit');
                    } else if (hitResult.tower && hitResult.tower.isAoE) {
                        this.particleSystem.createParticle(projectile.x, projectile.y, 'explosion');
                    } else {
                        this.particleSystem.createParticle(projectile.x, projectile.y, 'explosion');
                    }
                }
                
                // Artifact: Frozen düşmanlara ekstra hasar
                if (hitResult && modifications.damageMultiplier > 1 && projectile.target.frozen) {
                    const extraDamage = Math.floor(hitResult.damage * (modifications.damageMultiplier - 1));
                    projectile.target.takeDamage(extraDamage, projectile.damageType);
                    this.damageNumbers.addDamage(
                        projectile.target.position.x,
                        projectile.target.position.y,
                        extraDamage,
                        false,
                        projectile.damageType === 'magic'
                    );
                    this.particleSystem.createParticle(projectile.target.position.x, projectile.target.position.y, 'freeze');
                }
                
                // AoE hasar için bilgi topla
                if (hitResult && hitResult.tower && hitResult.tower.isAoE) {
                    aoeHits.push({
                        position: hitResult.position,
                        damage: hitResult.damage * 0.5,
                        damageType: projectile.damageType,
                        radius: hitResult.tower.aoeRadius
                    });
                }
            } else {
                // Hareket ettir
                const moveDistance = projectile.speed * deltaTime * 0.1;
                projectile.x += (dx / distance) * moveDistance;
                projectile.y += (dy / distance) * moveDistance;
            }
        }
        
        // AoE hasar uygula (güncel enemy listesi ile)
        const updatedEnemies = this.state.get('enemies');
        for (const hit of aoeHits) {
            for (const enemy of updatedEnemies) {
                if (enemy.isDead() || enemy.reachedEnd) continue;
                
                const dx = enemy.position.x - hit.position.x;
                const dy = enemy.position.y - hit.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= hit.radius) {
                    enemy.takeDamage(hit.damage, hit.damageType);
                }
            }
        }
    }
    
    completeWave() {
        const state = this.state.getState();
        const waveReward = this.economy.getWaveReward(state.wave);
        
        // Artifact: Altın çarpanı
        const modifications = this.artifactSystem.applyArtifactEffects(null, {});
        const finalReward = Math.floor(waveReward * modifications.goldMultiplier);
        
        // Artifact: Dalga sonu can yenilenmesi
        let healthRegen = 0;
        for (const artifact of this.artifactSystem.getActiveArtifacts()) {
            if (artifact.effect.type === 'wave_health_regen') {
                healthRegen += artifact.effect.value;
            }
        }
        
        const newHealth = Math.min(20, state.health + healthRegen);
        
        this.state.setState({
            wave: state.wave + 1,
            gold: state.gold + finalReward,
            score: state.score + finalReward,
            health: newHealth,
            currentWave: null,
            waveInProgress: false,
            gameState: 'preparation'
        });
        
        // Tüm mermileri ve partikülleri temizle
        this.projectilePool.clear();
        this.particleSystem.clear();
        this.damageNumbers.clear();
        
        // Mini-boss sonrası (dalga 10) artifact seçimi
        if (state.wave === 10) {
            this.showArtifactSelection();
        }
        // Sonraki dalga hazırlık ekranı
        else if (state.wave < 10) {
            this.showPreparationScreen();
        } else {
            this.victory();
        }
    }
    
    render() {
        const state = this.state.getState();
        
        // Mobilde render optimizasyonu (her frame değil, her 2 frame'de bir)
        if (this.isMobile && this.frameSkip) {
            this.frameSkip = false;
            return;
        }
        this.frameSkip = true;
        
        // Canvas temizle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Harita çiz
        this.map.draw(this.ctx);
        
        // Kule yerleştirme önizlemesi
        if (state.placementMode && state.hoveredTile) {
            const x = state.hoveredTile.x;
            const y = state.hoveredTile.y;
            
            if (this.map.canPlaceTower(x, y, state.towers)) {
                this.ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
            } else {
                this.ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Kuleleri çiz
        for (const tower of state.towers) {
            const showRange = state.selectedTower === tower;
            tower.draw(this.ctx, showRange);
        }
        
        // Düşmanları çiz
        for (const enemy of state.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Mermileri çiz
        this.projectilePool.draw(this.ctx);
        
        // Partikülleri çiz
        this.particleSystem.draw(this.ctx);
        
        // Hasar sayılarını çiz
        this.damageNumbers.draw(this.ctx);
        
        // HUD güncelle
        this.hud.update(state);
        
        // Panel güncelle
        if (state.selectedTower) {
            this.panels.updateGold(state.gold);
        }
    }
    
    onStateChange(oldState, newState) {
        // State değişikliklerine göre UI güncellemeleri
        if (oldState.gameSpeed !== newState.gameSpeed) {
            this.hud.setSpeed(newState.gameSpeed);
        }
    }
    
    // Skor tablosunu göster
    showScoreboard() {
        const screen = document.getElementById('scoreboard-screen');
        const list = document.getElementById('scoreboard-list');
        
        const scores = this.progressSystem.getHighScores(10);
        
        if (scores.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #aaa;">Henüz skor yok. İlk oyununu oyna!</p>';
        } else {
            list.innerHTML = scores.map((score, index) => {
                const date = new Date(score.date);
                const dateStr = date.toLocaleDateString('tr-TR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="scoreboard-item">
                        <div class="scoreboard-rank ${index === 0 ? 'first' : ''}">#${index + 1}</div>
                        <div class="scoreboard-details">
                            <div class="scoreboard-score">${score.score} puan</div>
                            <div class="scoreboard-meta">Dalga: ${score.wave} | Artifactler: ${score.artifacts.length}</div>
                        </div>
                        <div class="scoreboard-date">${dateStr}</div>
                    </div>
                `;
            }).join('');
        }
        
        screen.classList.remove('hidden');
    }
    
    // Skor tablosunu gizle
    hideScoreboard() {
        const screen = document.getElementById('scoreboard-screen');
        if (screen) {
            screen.classList.add('hidden');
        }
    }
    
    // Kule unlock'larını güncelle
    updateTowerUnlocks() {
        const towerButtons = document.querySelectorAll('.tower-btn');
        towerButtons.forEach(btn => {
            const towerType = btn.dataset.tower;
            if (towerType && !this.progressSystem.isTowerUnlocked(towerType)) {
                btn.classList.add('locked');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            } else if (towerType) {
                btn.classList.remove('locked');
            }
        });
    }
    
    // Achievement göster
    showAchievement(achievement) {
        const popup = document.getElementById('achievement-popup');
        if (!popup) return;
        
        const icon = popup.querySelector('.achievement-icon');
        const title = popup.querySelector('.achievement-title');
        const description = popup.querySelector('.achievement-description');
        
        if (icon) icon.textContent = achievement.icon;
        if (title) title.textContent = achievement.name;
        if (description) description.textContent = achievement.description;
        
        popup.classList.remove('hidden');
        
        // 3 saniye sonra gizle
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 3000);
    }
}

// Oyunu başlat
const game = new Game();

