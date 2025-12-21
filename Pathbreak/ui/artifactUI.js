// Artifact UI yönetimi
class ArtifactUI {
    constructor() {
        this.elements = {
            artifactScreen: document.getElementById('artifact-selection-screen'),
            artifactOptions: document.getElementById('artifact-options'),
            activeArtifacts: document.getElementById('active-artifacts'),
            activeArtifactsList: document.getElementById('active-artifacts-list')
        };
        
        this.selectedArtifact = null;
        this.onArtifactSelected = null;
    }
    
    // Artifact seçim ekranını göster
    showArtifactSelection(artifacts) {
        this.elements.artifactOptions.innerHTML = '';
        
        artifacts.forEach((artifact, index) => {
            const card = document.createElement('div');
            card.className = 'artifact-card';
            card.dataset.artifactId = artifact.id;
            
            const categoryNames = {
                damage: 'Hasar',
                speed: 'Hız',
                economy: 'Ekonomi',
                defense: 'Savunma',
                special: 'Özel'
            };
            
            card.innerHTML = `
                <div class="artifact-icon">${artifact.icon}</div>
                <div class="artifact-name">${artifact.name}</div>
                <div class="artifact-description">${artifact.description}</div>
                <div class="artifact-category">${categoryNames[artifact.category] || artifact.category}</div>
            `;
            
            card.addEventListener('click', () => {
                this.selectArtifact(artifact, card);
            });
            
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('selected')) {
                    card.style.borderColor = '#4ecdc4';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('selected')) {
                    card.style.borderColor = '#16213e';
                }
            });
            
            this.elements.artifactOptions.appendChild(card);
        });
        
        this.elements.artifactScreen.classList.remove('hidden');
    }
    
    // Artifact seç
    selectArtifact(artifact, cardElement) {
        // Önceki seçimi kaldır
        document.querySelectorAll('.artifact-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Yeni seçimi işaretle
        cardElement.classList.add('selected');
        this.selectedArtifact = artifact;
        
        // 0.5 saniye sonra seçimi onayla (animasyon için)
        setTimeout(() => {
            if (this.onArtifactSelected) {
                this.onArtifactSelected(artifact);
            }
        }, 500);
    }
    
    // Artifact seçim ekranını gizle
    hideArtifactSelection() {
        this.elements.artifactScreen.classList.add('hidden');
        this.selectedArtifact = null;
    }
    
    // Aktif artifactleri göster
    updateActiveArtifacts(artifacts) {
        if (!artifacts || artifacts.length === 0) {
            this.elements.activeArtifacts.classList.add('hidden');
            return;
        }
        
        this.elements.activeArtifacts.classList.remove('hidden');
        this.elements.activeArtifactsList.innerHTML = '';
        
        artifacts.forEach(artifact => {
            const item = document.createElement('div');
            item.className = 'active-artifact-item';
            item.innerHTML = `
                <span class="artifact-icon">${artifact.icon}</span>
                <span>${artifact.name}</span>
            `;
            this.elements.activeArtifactsList.appendChild(item);
        });
    }
    
    // Callback ayarla
    setOnArtifactSelected(callback) {
        this.onArtifactSelected = callback;
    }
}

export default ArtifactUI;

