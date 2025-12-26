import { GAME_CONFIG } from './constants.js';

export const createPlayer = (spawn, role, upgrades) => ({
  id: 'player',
  x: spawn.x,
  y: spawn.y,
  vx: 0,
  vy: 0,
  radius: 14,
  health: GAME_CONFIG.player.health,
  loot: 0,
  creditsEarned: 0,
  role,
  dash: { active: false, time: 0, cooldown: 0 },
  ability: { active: false, time: 0, cooldown: 0 },
  weapon: {
    name: 'rifle',
    ammo: GAME_CONFIG.weapons.rifle.magazine,
    reserve: GAME_CONFIG.weapons.rifle.reserve,
    fireCooldown: 0,
    reload: 0,
  },
  upgrades,
});

let botId = 0;
export const createBot = (spawn) => ({
  id: `bot-${botId += 1}`,
  x: spawn.x,
  y: spawn.y,
  vx: 0,
  vy: 0,
  radius: 13,
  health: GAME_CONFIG.bot.health,
  alive: true,
  state: 'patrol',
  fireCooldown: 0,
  patrolIndex: 0,
  patrolPoints: [
    { x: spawn.x, y: spawn.y },
    { x: spawn.x + 140, y: spawn.y + 60 },
    { x: spawn.x - 120, y: spawn.y + 120 },
  ],
});

export const createBullet = () => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  damage: 0,
  owner: 'player',
  active: false,
});

export const createParticle = () => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  color: '#2cf8ff',
  size: 2,
  active: false,
});

export const createPickup = (spawn) => ({
  x: spawn.x,
  y: spawn.y,
  radius: 10,
  value: GAME_CONFIG.pickups.lootValue,
  active: true,
});
