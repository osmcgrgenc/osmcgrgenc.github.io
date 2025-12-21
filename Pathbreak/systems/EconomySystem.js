// Ekonomi sistemi
class EconomySystem {
    constructor() {
        // Kule maliyetleri
        this.towerCosts = {
            archer: 50,
            freeze: 75,
            cannon: 100,
            mage: 90
        };
        
        // Yükseltme maliyetleri
        this.upgradeCosts = {
            archer: 30,
            freeze: 40,
            cannon: 50,
            mage: 45
        };
    }
    
    // Kule satın al
    canAffordTower(gold, towerType) {
        return gold >= this.towerCosts[towerType];
    }
    
    // Kule satın al
    buyTower(gold, towerType) {
        const cost = this.towerCosts[towerType];
        if (gold >= cost) {
            return {
                success: true,
                newGold: gold - cost,
                cost: cost
            };
        }
        return {
            success: false,
            newGold: gold,
            cost: cost
        };
    }
    
    // Kule yükselt
    canAffordUpgrade(gold, towerType, level) {
        if (level >= 3) return false;
        return gold >= this.upgradeCosts[towerType];
    }
    
    // Kule yükselt
    upgradeTower(gold, towerType, level) {
        if (level >= 3) {
            return {
                success: false,
                newGold: gold,
                cost: 0
            };
        }
        
        const cost = this.upgradeCosts[towerType];
        if (gold >= cost) {
            return {
                success: true,
                newGold: gold - cost,
                cost: cost
            };
        }
        
        return {
            success: false,
            newGold: gold,
            cost: cost
        };
    }
    
    // Kule sat
    sellTower(tower) {
        return Math.floor((tower.cost + (tower.level - 1) * this.upgradeCosts[tower.type]) * 0.7);
    }
    
    // Düşman ödülü
    getEnemyReward(enemyType) {
        const rewards = {
            runner: 5,
            tank: 15,
            swarm: 2,
            miniBoss: 50,
            boss: 200
        };
        
        return rewards[enemyType] || 5;
    }
    
    // Dalga ödülü
    getWaveReward(waveNumber) {
        const rewards = {
            1: 20,
            2: 25,
            3: 30,
            4: 40,
            5: 45,
            6: 50,
            7: 60,
            8: 70,
            9: 80,
            10: 100
        };
        
        return rewards[waveNumber] || 20;
    }
}

export default EconomySystem;

