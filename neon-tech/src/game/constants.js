export const GAME_CONFIG = {
  tickRate: 60,
  map: {
    tileSize: 32,
    width: 40,
    height: 22,
  },
  match: {
    duration: 360,
    extractionOpen: 180,
    extractionClose: 360,
  },
  player: {
    speed: 180,
    dashSpeed: 320,
    dashDuration: 0.35,
    dashCooldown: 6,
    health: 100,
    reloadTime: 1.6,
    lootCapacity: 5,
  },
  hacker: {
    visionDuration: 3,
    cooldown: 12,
  },
  bruiser: {
    shieldDuration: 3,
    cooldown: 10,
    damageReduction: 0.5,
  },
  weapons: {
    pistol: {
      damage: 12,
      fireRate: 0.35,
      range: 500,
      spread: 0.05,
    },
    rifle: {
      damage: 22,
      fireRate: 0.12,
      range: 700,
      spread: 0.02,
      magazine: 30,
      reserve: 90,
    },
  },
  bot: {
    health: 70,
    speed: 140,
    sightRange: 360,
    fireRate: 0.4,
    damage: 10,
  },
  pickups: {
    lootValue: 25,
  },
  upgrades: {
    storage: [5, 7, 9],
    scanner: [220, 280, 340],
    workbench: [1, 1.1, 1.2],
  },
};
