// Immutable state manager
class GameState {
    constructor() {
        this.state = {
            // Oyun durumu
            gameState: 'menu', // menu, preparation, playing, paused, gameOver
            
            // Kaynaklar
            health: 20,
            gold: 100,
            wave: 0,
            score: 0,
            
            // Hız kontrolü
            gameSpeed: 1,
            
            // Panic token
            panicTokens: 1,
            
            // Kuleler
            towers: [],
            selectedTower: null,
            placementMode: null, // null, 'archer', 'freeze', 'cannon'
            
            // Düşmanlar
            enemies: [],
            
            // Mermiler
            projectiles: [],
            
            // Dalga sistemi
            currentWave: null,
            waveInProgress: false,
            
            // Harita
            map: null,
            path: null,
            
            // UI
            hoveredTile: null
        };
        
        this.listeners = [];
    }
    
    // State'i güncelle
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifyListeners(oldState, this.state);
    }
    
    // Belirli bir değeri güncelle
    update(key, value) {
        this.setState({ [key]: value });
    }
    
    // State'i al
    getState() {
        return { ...this.state };
    }
    
    // Belirli bir değeri al
    get(key) {
        return this.state[key];
    }
    
    // Listener ekle
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    // Listener'ları bilgilendir
    notifyListeners(oldState, newState) {
        this.listeners.forEach(listener => {
            listener(oldState, newState);
        });
    }
    
    // Reset state
    reset() {
        this.state = {
            gameState: 'menu',
            health: 20,
            gold: 100,
            wave: 0,
            score: 0,
            gameSpeed: 1,
            panicTokens: 1,
            towers: [],
            selectedTower: null,
            placementMode: null,
            enemies: [],
            projectiles: [],
            currentWave: null,
            waveInProgress: false,
            map: null,
            path: null,
            hoveredTile: null
        };
        this.notifyListeners({}, this.state);
    }
}

export default GameState;

