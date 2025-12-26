export class DebugOverlay {
  constructor(element) {
    this.element = element;
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.element.classList.toggle('hidden', !this.enabled);
  }

  update({ fps, entities, bullets, particles, tickTime }) {
    if (!this.enabled) return;
    this.element.textContent = `FPS: ${fps.toFixed(1)}\nEntities: ${entities}\nBullets: ${bullets}\nParticles: ${particles}\nTick: ${tickTime.toFixed(2)}ms`;
  }
}
