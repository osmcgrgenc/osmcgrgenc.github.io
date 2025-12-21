// Dalga sistemi
class WaveSystem {
    constructor() {
        this.waveData = this.generateWaveData();
    }
    
    // Dalga verilerini oluştur
    generateWaveData() {
        return [
            // Dalga 1-3: Öğretici
            {
                wave: 1,
                enemies: [
                    { type: 'runner', count: 5, delay: 500 },
                    { type: 'swarm', count: 3, delay: 800 }
                ],
                reward: 20
            },
            {
                wave: 2,
                enemies: [
                    { type: 'runner', count: 8, delay: 400 },
                    { type: 'swarm', count: 5, delay: 600 }
                ],
                reward: 25
            },
            {
                wave: 3,
                enemies: [
                    { type: 'runner', count: 10, delay: 400 },
                    { type: 'swarm', count: 8, delay: 500 }
                ],
                reward: 30
            },
            // Dalga 4-6: Tank + Swarm karışımı
            {
                wave: 4,
                enemies: [
                    { type: 'runner', count: 8, delay: 400 },
                    { type: 'tank', count: 2, delay: 1000 },
                    { type: 'swarm', count: 10, delay: 500 }
                ],
                reward: 40
            },
            {
                wave: 5,
                enemies: [
                    { type: 'runner', count: 12, delay: 350 },
                    { type: 'tank', count: 3, delay: 800 },
                    { type: 'swarm', count: 12, delay: 400 }
                ],
                reward: 45
            },
            {
                wave: 6,
                enemies: [
                    { type: 'runner', count: 15, delay: 300 },
                    { type: 'tank', count: 4, delay: 700 },
                    { type: 'swarm', count: 15, delay: 350 }
                ],
                reward: 50
            },
            // Dalga 7-9: Yoğun baskı
            {
                wave: 7,
                enemies: [
                    { type: 'runner', count: 20, delay: 250 },
                    { type: 'tank', count: 5, delay: 600 },
                    { type: 'swarm', count: 20, delay: 300 }
                ],
                reward: 60
            },
            {
                wave: 8,
                enemies: [
                    { type: 'runner', count: 25, delay: 200 },
                    { type: 'tank', count: 6, delay: 500 },
                    { type: 'swarm', count: 25, delay: 250 }
                ],
                reward: 70
            },
            {
                wave: 9,
                enemies: [
                    { type: 'runner', count: 30, delay: 200 },
                    { type: 'tank', count: 8, delay: 400 },
                    { type: 'swarm', count: 30, delay: 200 }
                ],
                reward: 80
            },
            // Dalga 10: Mini-Boss
            {
                wave: 10,
                enemies: [
                    { type: 'runner', count: 15, delay: 300 },
                    { type: 'tank', count: 3, delay: 800 },
                    { type: 'swarm', count: 20, delay: 250 },
                    { type: 'miniBoss', count: 1, delay: 2000 }
                ],
                reward: 100
            },
            // Dalga 15: Final Boss (opsiyonel, gelecekte eklenebilir)
            {
                wave: 15,
                enemies: [
                    { type: 'runner', count: 20, delay: 250 },
                    { type: 'tank', count: 5, delay: 600 },
                    { type: 'swarm', count: 30, delay: 200 },
                    { type: 'boss', count: 1, delay: 3000 }
                ],
                reward: 300
            }
        ];
    }
    
    // Dalga başlat
    startWave(waveNumber) {
        const wave = this.waveData[waveNumber - 1];
        if (!wave) return null;
        
        return {
            ...wave,
            currentEnemyIndex: 0,
            spawnTimer: 0,
            isComplete: false
        };
    }
    
    // Düşman spawn et
    spawnEnemies(currentWave, currentTime, path) {
        if (!currentWave || currentWave.isComplete) return [];
        
        // İlk spawn için timer'ı başlat
        if (currentWave.startTime === undefined) {
            currentWave.startTime = currentTime;
            currentWave.spawnedCounts = {};
            currentWave.lastSpawnTime = {};
            
            // Her grup için başlangıç zamanı hesapla
            const wave = this.waveData[currentWave.wave - 1];
            let cumulativeTime = 0;
            wave.enemies.forEach((group, index) => {
                currentWave.spawnedCounts[index] = 0;
                currentWave.lastSpawnTime[index] = cumulativeTime - group.delay;
                cumulativeTime += group.count * group.delay;
            });
        }
        
        const spawned = [];
        const wave = this.waveData[currentWave.wave - 1];
        const elapsedTime = currentTime - currentWave.startTime;
        
        // Her grup için spawn kontrolü
        wave.enemies.forEach((enemyGroup, groupIndex) => {
            const spawnedCount = currentWave.spawnedCounts[groupIndex] || 0;
            
            if (spawnedCount < enemyGroup.count) {
                // Grup başlangıç zamanı
                let groupStartTime = 0;
                for (let i = 0; i < groupIndex; i++) {
                    groupStartTime += wave.enemies[i].count * wave.enemies[i].delay;
                }
                
                // Bu grup için spawn zamanı geldi mi?
                if (elapsedTime >= groupStartTime) {
                    const timeSinceLastSpawn = elapsedTime - (currentWave.lastSpawnTime[groupIndex] || groupStartTime - enemyGroup.delay);
                    
                    if (timeSinceLastSpawn >= enemyGroup.delay) {
                        spawned.push({
                            type: enemyGroup.type,
                            path: path
                        });
                        
                        currentWave.spawnedCounts[groupIndex] = spawnedCount + 1;
                        currentWave.lastSpawnTime[groupIndex] = elapsedTime;
                    }
                }
            }
        });
        
        // Tüm düşmanlar spawn edildi mi kontrol et
        let allSpawned = true;
        for (let i = 0; i < wave.enemies.length; i++) {
            const count = currentWave.spawnedCounts[i] || 0;
            if (count < wave.enemies[i].count) {
                allSpawned = false;
                break;
            }
        }
        
        if (allSpawned) {
            currentWave.isComplete = true;
        }
        
        return spawned;
    }
    
    // Dalga tamamlandı mı?
    isWaveComplete(currentWave, enemies) {
        if (!currentWave) return false;
        
        // Tüm düşmanlar spawn edildi ve öldü mü?
        const aliveEnemies = enemies.filter(e => !e.isDead() && !e.reachedEnd);
        
        if (currentWave.isComplete && aliveEnemies.length === 0) {
            return true;
        }
        
        return false;
    }
    
    // Sonraki dalga bilgisi
    getNextWaveInfo(waveNumber) {
        const wave = this.waveData[waveNumber];
        if (!wave) return null;
        
        const enemyTypes = {};
        wave.enemies.forEach(group => {
            enemyTypes[group.type] = (enemyTypes[group.type] || 0) + group.count;
        });
        
        return {
            wave: wave.wave,
            enemies: enemyTypes,
            reward: wave.reward
        };
    }
}

export default WaveSystem;

