// Artifact sistemi (Roguelite)
class ArtifactSystem {
    constructor() {
        this.artifacts = this.generateArtifacts();
        this.activeArtifacts = [];
    }
    
    // Tüm artifactleri oluştur
    generateArtifacts() {
        return [
            // DPS Artifactleri
            {
                id: 'frozen_vulnerability',
                name: 'Buz Kırılganlığı',
                description: 'Dondurulmuş düşmanlar %20 daha fazla hasar alır',
                category: 'damage',
                effect: {
                    type: 'frozen_damage_multiplier',
                    value: 1.2
                },
                icon: '❄️'
            },
            {
                id: 'critical_mastery',
                name: 'Kritik Ustası',
                description: 'Tüm kulelerin kritik vuruş şansı +15%',
                category: 'damage',
                effect: {
                    type: 'crit_chance_bonus',
                    value: 0.15
                },
                icon: '⚡'
            },
            {
                id: 'armor_breaker',
                name: 'Zırh Kırıcı',
                description: 'Tüm fiziksel hasar zırhı %50 daha fazla deler',
                category: 'damage',
                effect: {
                    type: 'armor_penetration_multiplier',
                    value: 1.5
                },
                icon: '🗡️'
            },
            
            // Hız Artifactleri
            {
                id: 'rapid_fire',
                name: 'Hızlı Ateş',
                description: 'Tüm kuleler %10 daha hızlı atar',
                category: 'speed',
                effect: {
                    type: 'fire_rate_multiplier',
                    value: 0.9 // 0.9 = %10 daha hızlı (fireRate azalır)
                },
                icon: '🔥'
            },
            {
                id: 'tower_focus',
                name: 'Kule Odaklanması',
                description: 'Kuleler %15 daha uzun menzile sahip',
                category: 'speed',
                effect: {
                    type: 'range_multiplier',
                    value: 1.15
                },
                icon: '🎯'
            },
            
            // Ekonomi Artifactleri
            {
                id: 'golden_touch',
                name: 'Altın Dokunuş',
                description: 'Düşman öldürme ödülleri %25 artar',
                category: 'economy',
                effect: {
                    type: 'gold_multiplier',
                    value: 1.25
                },
                icon: '💰'
            },
            {
                id: 'efficient_upgrades',
                name: 'Verimli Yükseltmeler',
                description: 'Kule yükseltme maliyetleri %20 azalır',
                category: 'economy',
                effect: {
                    type: 'upgrade_cost_multiplier',
                    value: 0.8
                },
                icon: '📈'
            },
            
            // Savunma Artifactleri
            {
                id: 'fortress',
                name: 'Kale',
                description: 'Başlangıç canı +5',
                category: 'defense',
                effect: {
                    type: 'starting_health_bonus',
                    value: 5
                },
                icon: '🛡️'
            },
            {
                id: 'regeneration',
                name: 'Yenilenme',
                description: 'Her dalga sonunda +1 can kazanırsın',
                category: 'defense',
                effect: {
                    type: 'wave_health_regen',
                    value: 1
                },
                icon: '💚'
            },
            
            // Özel Artifactler
            {
                id: 'chain_reaction',
                name: 'Zincir Reaksiyon',
                description: 'Öldürülen düşmanlar yakındaki düşmanlara hasar verir',
                category: 'special',
                effect: {
                    type: 'death_explosion',
                    value: 20,
                    radius: 50
                },
                icon: '💥'
            },
            {
                id: 'slow_mastery',
                name: 'Yavaşlatma Ustası',
                description: 'Yavaşlatma efektleri %50 daha güçlü',
                category: 'special',
                effect: {
                    type: 'slow_effectiveness_multiplier',
                    value: 1.5
                },
                icon: '🐌'
            },
            {
                id: 'tower_synergy',
                name: 'Kule Sinerjisi',
                description: 'Yakındaki kuleler birbirine %10 hasar bonusu verir',
                category: 'special',
                effect: {
                    type: 'tower_synergy',
                    value: 0.1,
                    radius: 100
                },
                icon: '🔗'
            }
        ];
    }
    
    // Rastgele 3 artifact seç
    getRandomArtifacts(excludeIds = []) {
        const available = this.artifacts.filter(a => !excludeIds.includes(a.id));
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }
    
    // Artifact ekle
    addArtifact(artifact) {
        this.activeArtifacts.push(artifact);
    }
    
    // Aktif artifactleri al
    getActiveArtifacts() {
        return this.activeArtifacts;
    }
    
    // Artifact efektlerini uygula
    applyArtifactEffects(entity, context = {}) {
        let modifications = {
            damageMultiplier: 1,
            critChanceBonus: 0,
            fireRateMultiplier: 1,
            rangeMultiplier: 1,
            armorPenetrationMultiplier: 1,
            goldMultiplier: 1,
            upgradeCostMultiplier: 1
        };
        
        for (const artifact of this.activeArtifacts) {
            const effect = artifact.effect;
            
            switch (effect.type) {
                case 'frozen_damage_multiplier':
                    if (context.enemy && context.enemy.frozen) {
                        modifications.damageMultiplier *= effect.value;
                    }
                    break;
                    
                case 'crit_chance_bonus':
                    if (entity && entity.critChance !== undefined) {
                        modifications.critChanceBonus += effect.value;
                    }
                    break;
                    
                case 'fire_rate_multiplier':
                    if (entity && entity.fireRate !== undefined) {
                        modifications.fireRateMultiplier *= effect.value;
                    }
                    break;
                    
                case 'range_multiplier':
                    if (entity && entity.range !== undefined) {
                        modifications.rangeMultiplier *= effect.value;
                    }
                    break;
                    
                case 'armor_penetration_multiplier':
                    if (entity && entity.armorPenetration !== undefined) {
                        modifications.armorPenetrationMultiplier *= effect.value;
                    }
                    break;
                    
                case 'gold_multiplier':
                    modifications.goldMultiplier *= effect.value;
                    break;
                    
                case 'upgrade_cost_multiplier':
                    modifications.upgradeCostMultiplier *= effect.value;
                    break;
            }
        }
        
        return modifications;
    }
    
    // Özel efektleri kontrol et (death explosion, synergy, vb.)
    checkSpecialEffects(event, context) {
        const results = [];
        
        for (const artifact of this.activeArtifacts) {
            const effect = artifact.effect;
            
            switch (effect.type) {
                case 'death_explosion':
                    if (event === 'enemy_killed' && context.enemy) {
                        results.push({
                            type: 'explosion',
                            position: { ...context.enemy.position },
                            damage: effect.value,
                            radius: effect.radius
                        });
                    }
                    break;
                    
                case 'slow_effectiveness_multiplier':
                    if (event === 'apply_slow' && context.enemy) {
                        context.enemy.slowMultiplier *= (1 / effect.value);
                    }
                    break;
                    
                case 'tower_synergy':
                    if (event === 'tower_damage' && context.tower && context.towers) {
                        // Yakındaki kuleleri bul
                        const nearbyTowers = context.towers.filter(t => {
                            if (t === context.tower) return false;
                            const dx = t.position.x - context.tower.position.x;
                            const dy = t.position.y - context.tower.position.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            return dist <= effect.radius;
                        });
                        
                        if (nearbyTowers.length > 0) {
                            results.push({
                                type: 'synergy_bonus',
                                multiplier: 1 + (effect.value * nearbyTowers.length)
                            });
                        }
                    }
                    break;
            }
        }
        
        return results;
    }
    
    // Reset (yeni run için)
    reset() {
        this.activeArtifacts = [];
    }
}

export default ArtifactSystem;

