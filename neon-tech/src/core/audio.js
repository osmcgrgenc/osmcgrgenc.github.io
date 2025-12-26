export class AudioBus {
  constructor(settings) {
    this.settings = settings;
  }

  playSfx(name) {
    if (this.settings.sfxVolume <= 0) return;
    // Placeholder: plug in actual audio buffers later.
    console.debug(`[SFX] ${name}`);
  }

  playMusic(name) {
    if (this.settings.musicVolume <= 0) return;
    console.debug(`[MUSIC] ${name}`);
  }
}
