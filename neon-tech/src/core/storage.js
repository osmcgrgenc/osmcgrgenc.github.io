const STORAGE_KEY = 'neon-heist-profile';

const defaultProfile = {
  credits: 0,
  role: 'runner',
  upgrades: { storage: 1, scanner: 1, workbench: 1 },
  settings: { masterVolume: 0.6, sfxVolume: 0.7, musicVolume: 0.4 },
};

export const Storage = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProfile };
    try {
      const parsed = JSON.parse(raw);
      return {
        ...defaultProfile,
        ...parsed,
        upgrades: { ...defaultProfile.upgrades, ...parsed.upgrades },
        settings: { ...defaultProfile.settings, ...parsed.settings },
      };
    } catch (error) {
      console.warn('Failed to load profile', error);
      return { ...defaultProfile };
    }
  },

  save(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },
};
