import { GAME_CONFIG } from './constants.js';
import { Map } from './map.js';
import { createBot, createBullet, createParticle, createPickup, createPlayer } from './entities.js';
import { Pool } from '../core/pool.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const normalize = (x, y) => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};

const worldToScreen = (world, camera) => ({
  x: world.x - camera.x,
  y: world.y - camera.y,
});

export class GameSession {
  constructor({ canvas, input, hud, audio, profile, onMatchEnd, debug }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.hud = hud;
    this.audio = audio;
    this.profile = profile;
    this.onMatchEnd = onMatchEnd;
    this.debug = debug;

    this.camera = { x: 0, y: 0 };
    this.elapsed = 0;
    this.timeLeft = GAME_CONFIG.match.duration;
    this.extraction = {
      ...Map.extractionZone,
      open: false,
    };
    this.ping = { active: false, x: 0, y: 0, time: 0 };
    this.screenShake = { time: 0, intensity: 0 };

    this.player = createPlayer(Map.playerSpawn, profile.role, profile.upgrades);
    this.bots = Map.botSpawns.map(createBot);
    this.pickups = Map.lootSpawns.map(createPickup);

    this.bulletPool = new Pool(createBullet, 120);
    this.particlePool = new Pool(createParticle, 160);

    this.lastKeys = new Set();
    this.tickTimeMs = 0;
    this.fps = 60;
    this.frameTimes = [];

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(dt) {
    const tickStart = performance.now();
    this.elapsed += dt;
    this.timeLeft = Math.max(0, GAME_CONFIG.match.duration - this.elapsed);
    this.extraction.open = this.elapsed >= GAME_CONFIG.match.extractionOpen && this.elapsed < GAME_CONFIG.match.extractionClose;

    this.updateInputStates();
    this.updatePlayer(dt);
    this.updateBots(dt);
    this.updateBullets(dt);
    this.updateParticles(dt);
    this.updatePickups();
    this.updatePing(dt);
    this.updateCamera();
    this.checkExtraction();

    if (this.player.health <= 0) {
      this.endMatch(false);
    }

    if (this.timeLeft <= 0) {
      this.endMatch(false);
    }

    this.hud.update(dt);
    this.updateHud();

    const tickEnd = performance.now();
    this.tickTimeMs = tickEnd - tickStart;
  }

  updateInputStates() {
    this.justPressed = new Set();
    this.input.keys.forEach((key) => {
      if (!this.lastKeys.has(key)) this.justPressed.add(key);
    });
    this.lastKeys = new Set(this.input.keys);
  }

  updatePlayer(dt) {
    const player = this.player;
    const upgrades = player.upgrades;
    if (player.weapon.fireCooldown > 0) player.weapon.fireCooldown = Math.max(0, player.weapon.fireCooldown - dt);
    if (player.weapon.reload > 0) player.weapon.reload = Math.max(0, player.weapon.reload - dt);
    const moveX = (this.input.isDown('KeyA') ? -1 : 0) + (this.input.isDown('KeyD') ? 1 : 0);
    const moveY = (this.input.isDown('KeyW') ? -1 : 0) + (this.input.isDown('KeyS') ? 1 : 0);
    const moveDir = normalize(moveX, moveY);

    if (player.dash.cooldown > 0) player.dash.cooldown -= dt;
    if (player.ability.cooldown > 0) player.ability.cooldown -= dt;

    if (player.role === 'runner' && this.justPressed.has('KeyE') && player.dash.cooldown <= 0) {
      player.dash.active = true;
      player.dash.time = GAME_CONFIG.player.dashDuration;
      player.dash.cooldown = GAME_CONFIG.player.dashCooldown;
    }

    if (player.role === 'hacker' && this.justPressed.has('KeyE') && player.ability.cooldown <= 0) {
      player.ability.active = true;
      player.ability.time = GAME_CONFIG.hacker.visionDuration;
      player.ability.cooldown = GAME_CONFIG.hacker.cooldown;
    }

    if (player.role === 'bruiser' && this.justPressed.has('KeyE') && player.ability.cooldown <= 0) {
      player.ability.active = true;
      player.ability.time = GAME_CONFIG.bruiser.shieldDuration;
      player.ability.cooldown = GAME_CONFIG.bruiser.cooldown;
    }

    if (player.dash.active) {
      player.dash.time -= dt;
      if (player.dash.time <= 0) player.dash.active = false;
    }

    if (player.ability.active) {
      player.ability.time -= dt;
      if (player.ability.time <= 0) player.ability.active = false;
    }

    const speed = player.dash.active ? GAME_CONFIG.player.dashSpeed : GAME_CONFIG.player.speed;
    player.vx = moveDir.x * speed;
    player.vy = moveDir.y * speed;

    this.moveEntity(player, dt);

    if (this.input.mouse.down) {
      this.tryFire(player, dt);
    }

    if (this.justPressed.has('KeyR')) {
      this.reloadWeapon(player);
    }

    if (this.justPressed.has('Digit1')) {
      player.weapon.name = 'rifle';
    }

    if (this.justPressed.has('Digit2')) {
      player.weapon.name = 'pistol';
    }

    if (this.justPressed.has('KeyQ')) {
      this.setPing();
    }
  }

  updateBots(dt) {
    const player = this.player;
    this.bots.forEach((bot) => {
      if (!bot.alive) return;
      const playerDist = distance(bot, player);
      const hasLOS = playerDist < GAME_CONFIG.bot.sightRange && this.hasLineOfSight(bot, player);
      if (hasLOS) {
        bot.state = 'chase';
      } else if (bot.state !== 'patrol') {
        bot.state = 'patrol';
      }

      if (bot.state === 'chase') {
        const dir = normalize(player.x - bot.x, player.y - bot.y);
        bot.vx = dir.x * GAME_CONFIG.bot.speed;
        bot.vy = dir.y * GAME_CONFIG.bot.speed;
        if (bot.fireCooldown > 0) bot.fireCooldown -= dt;
        if (bot.fireCooldown <= 0 && playerDist < GAME_CONFIG.bot.sightRange) {
          this.spawnBullet(bot, dir, GAME_CONFIG.bot.damage, 'bot');
          bot.fireCooldown = GAME_CONFIG.bot.fireRate;
        }
      } else {
        const target = bot.patrolPoints[bot.patrolIndex];
        const dir = normalize(target.x - bot.x, target.y - bot.y);
        bot.vx = dir.x * (GAME_CONFIG.bot.speed * 0.6);
        bot.vy = dir.y * (GAME_CONFIG.bot.speed * 0.6);
        if (distance(bot, target) < 12) {
          bot.patrolIndex = (bot.patrolIndex + 1) % bot.patrolPoints.length;
        }
      }

      this.moveEntity(bot, dt);
    });
  }

  updateBullets(dt) {
    this.bulletPool.forEachActive((bullet) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;

      if (bullet.life <= 0 || this.collidesWithWalls(bullet.x, bullet.y, 4)) {
        this.bulletPool.release(bullet);
        return;
      }

      if (bullet.owner === 'player') {
        this.bots.forEach((bot) => {
          if (!bot.alive) return;
          if (distance(bullet, bot) < bot.radius) {
            bot.health -= bullet.damage;
            this.spawnHitParticles(bullet.x, bullet.y, '#ff4b7d');
            this.hud.showHitMarker();
            this.hud.addDamageNumber(this.toScreenX(bullet.x), this.toScreenY(bullet.y), Math.round(bullet.damage));
            if (bot.health <= 0) {
              bot.alive = false;
              this.spawnHitParticles(bot.x, bot.y, '#5bff8a');
            }
            this.bulletPool.release(bullet);
          }
        });
      } else if (bullet.owner === 'bot') {
        if (distance(bullet, this.player) < this.player.radius) {
          const damage = this.player.ability.active && this.player.role === 'bruiser'
            ? bullet.damage * GAME_CONFIG.bruiser.damageReduction
            : bullet.damage;
          this.player.health -= damage;
          this.screenShake = { time: 0.2, intensity: 4 };
          this.spawnHitParticles(bullet.x, bullet.y, '#ffbe4d');
          this.hud.addDamageNumber(this.toScreenX(bullet.x), this.toScreenY(bullet.y), Math.round(damage));
          this.bulletPool.release(bullet);
        }
      }
    });
  }

  updateParticles(dt) {
    this.particlePool.forEachActive((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particlePool.release(particle);
      }
    });
  }

  updatePickups() {
    const capacity = GAME_CONFIG.upgrades.storage[this.player.upgrades.storage - 1];
    this.pickups.forEach((pickup) => {
      if (!pickup.active) return;
      if (distance(pickup, this.player) < pickup.radius + this.player.radius) {
        if (this.player.loot < capacity) {
          pickup.active = false;
          this.player.loot += 1;
          this.spawnHitParticles(pickup.x, pickup.y, '#2cf8ff');
        }
      }
    });
  }

  updatePing(dt) {
    if (!this.ping.active) return;
    this.ping.time -= dt;
    if (this.ping.time <= 0) {
      this.ping.active = false;
    }
  }

  updateCamera() {
    const canvas = this.canvas;
    this.camera.x = clamp(this.player.x - canvas.width / 2, 0, Map.pixelWidth - canvas.width);
    this.camera.y = clamp(this.player.y - canvas.height / 2, 0, Map.pixelHeight - canvas.height);
    this.input.mouse.worldX = this.input.mouse.x + this.camera.x;
    this.input.mouse.worldY = this.input.mouse.y + this.camera.y;
  }

  moveEntity(entity, dt) {
    const nextX = entity.x + entity.vx * dt;
    const nextY = entity.y + entity.vy * dt;

    entity.x = this.resolveAxis(entity, nextX, entity.y, 'x');
    entity.y = this.resolveAxis(entity, entity.x, nextY, 'y');
  }

  resolveAxis(entity, nextX, nextY, axis) {
    const radius = entity.radius;
    const future = { x: nextX, y: nextY, radius };
    const collision = this.collidesWithWalls(future.x, future.y, radius);
    if (!collision) return axis === 'x' ? nextX : nextY;

    return axis === 'x' ? entity.x : entity.y;
  }

  collidesWithWalls(x, y, radius) {
    return Map.walls.some((wall) => {
      const closestX = clamp(x, wall.x, wall.x + wall.w);
      const closestY = clamp(y, wall.y, wall.y + wall.h);
      return Math.hypot(x - closestX, y - closestY) < radius;
    });
  }

  hasLineOfSight(start, end) {
    const steps = Math.max(1, Math.floor(distance(start, end) / 12));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      if (this.collidesWithWalls(x, y, 4)) return false;
    }
    return true;
  }

  tryFire(player) {
    const weapon = player.weapon;
    if (weapon.reload > 0 || weapon.fireCooldown > 0) {
      return;
    }

    const usingPistol = weapon.name === 'pistol' || (weapon.ammo <= 0 && weapon.reserve <= 0);
    if (!usingPistol && weapon.ammo <= 0) {
      this.reloadWeapon(player);
      return;
    }

    const stats = usingPistol ? GAME_CONFIG.weapons.pistol : GAME_CONFIG.weapons.rifle;
    const dir = normalize(this.input.mouse.worldX - player.x, this.input.mouse.worldY - player.y);
    const spread = (Math.random() - 0.5) * stats.spread;
    const cos = Math.cos(spread);
    const sin = Math.sin(spread);
    const bulletDir = { x: dir.x * cos - dir.y * sin, y: dir.x * sin + dir.y * cos };

    const damageBoost = GAME_CONFIG.upgrades.workbench[player.upgrades.workbench - 1];
    this.spawnBullet(player, bulletDir, stats.damage * damageBoost, 'player');
    if (!usingPistol) weapon.ammo -= 1;
    weapon.fireCooldown = stats.fireRate;
    this.audio.playSfx(usingPistol ? 'pistol_shot' : 'rifle_shot');
  }

  reloadWeapon(player) {
    const weapon = player.weapon;
    if (weapon.reload > 0 || weapon.ammo === GAME_CONFIG.weapons.rifle.magazine || weapon.reserve <= 0) return;
    weapon.reload = GAME_CONFIG.player.reloadTime;
    setTimeout(() => {
      const needed = GAME_CONFIG.weapons.rifle.magazine - weapon.ammo;
      const load = Math.min(needed, weapon.reserve);
      weapon.ammo += load;
      weapon.reserve -= load;
      weapon.reload = 0;
    }, GAME_CONFIG.player.reloadTime * 1000);
    this.audio.playSfx('reload');
  }

  spawnBullet(owner, dir, damage, ownerType) {
    const bullet = this.bulletPool.acquire();
    if (!bullet) return;
    bullet.x = owner.x + dir.x * 16;
    bullet.y = owner.y + dir.y * 16;
    bullet.vx = dir.x * 640;
    bullet.vy = dir.y * 640;
    bullet.life = 1.2;
    bullet.damage = damage;
    bullet.owner = ownerType;
  }

  spawnHitParticles(x, y, color) {
    for (let i = 0; i < 6; i += 1) {
      const particle = this.particlePool.acquire();
      if (!particle) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0.4 + Math.random() * 0.2;
      particle.color = color;
      particle.size = 2 + Math.random() * 2;
    }
  }

  setPing() {
    this.ping.active = true;
    this.ping.time = 3;
    this.ping.x = this.input.mouse.worldX;
    this.ping.y = this.input.mouse.worldY;
    this.audio.playSfx('ping');
  }

  updateHud() {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const seconds = Math.floor(this.timeLeft % 60).toString().padStart(2, '0');
    const extractionText = this.extraction.open
      ? 'Extraction: OPEN'
      : this.elapsed >= GAME_CONFIG.match.extractionClose
        ? 'Extraction: CLOSED'
        : 'Extraction: Locked';
    const abilityText = this.player.role === 'runner'
      ? (this.player.dash.cooldown > 0 ? `Dash CD ${this.player.dash.cooldown.toFixed(1)}s` : 'Dash Ready')
      : this.player.ability.cooldown > 0
        ? `Ability CD ${this.player.ability.cooldown.toFixed(1)}s`
        : 'Ability Ready';

    const usingPistol = this.player.weapon.name === 'pistol' || (this.player.weapon.ammo <= 0 && this.player.weapon.reserve <= 0);
    this.hud.setHUD({
      timeText: `${minutes}:${seconds}`,
      extractionText,
      loot: this.player.loot,
      credits: this.profile.credits,
      health: this.player.health,
      ammo: usingPistol ? '∞' : this.player.weapon.ammo,
      reserve: usingPistol ? '∞' : this.player.weapon.reserve,
      role: this.player.role,
      ability: abilityText,
    });

    const scannerRange = this.player.role === 'hacker' && this.player.ability.active
      ? GAME_CONFIG.upgrades.scanner[this.player.upgrades.scanner - 1]
      : 0;
    this.hud.drawMinimap(Map, this.player, this.bots, this.extraction, this.ping, scannerRange);
  }

  checkExtraction() {
    if (!this.extraction.open || this.player.loot <= 0) return;
    const inZone = this.player.x > this.extraction.x
      && this.player.x < this.extraction.x + this.extraction.w
      && this.player.y > this.extraction.y
      && this.player.y < this.extraction.y + this.extraction.h;
    if (inZone) {
      this.endMatch(true);
    }
  }

  endMatch(extracted) {
    if (this.ended) return;
    this.ended = true;
    const lootValue = this.player.loot * GAME_CONFIG.pickups.lootValue;
    let summary = '';
    if (extracted) {
      this.profile.credits += lootValue;
      summary = `Extraction secured. Loot converted: ${lootValue} credits.`;
    } else {
      summary = `Extraction failed. Loot lost: ${lootValue} credits.`;
    }
    this.onMatchEnd({ extracted, summary });
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (this.screenShake.time > 0) {
      this.screenShake.time -= 1 / GAME_CONFIG.tickRate;
      const offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
      const offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
      ctx.translate(offsetX, offsetY);
    }

    ctx.translate(-this.camera.x, -this.camera.y);

    ctx.fillStyle = '#09121b';
    ctx.fillRect(0, 0, Map.pixelWidth, Map.pixelHeight);

    ctx.fillStyle = '#122534';
    Map.walls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });

    this.pickups.forEach((pickup) => {
      if (!pickup.active) return;
      ctx.fillStyle = '#2cf8ff';
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = this.extraction.open ? '#5bff8a' : '#ffbe4d';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.extraction.x, this.extraction.y, this.extraction.w, this.extraction.h);

    if (this.ping.active) {
      ctx.strokeStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(this.ping.x, this.ping.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = this.player.role === 'bruiser' && this.player.ability.active ? '#5bff8a' : '#2cf8ff';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.player.role === 'runner' && this.player.dash.active) {
      ctx.strokeStyle = '#2cf8ff';
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.bots.forEach((bot) => {
      if (!bot.alive) return;
      ctx.fillStyle = '#ff4b7d';
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    this.bulletPool.forEachActive((bullet) => {
      ctx.fillStyle = bullet.owner === 'player' ? '#2cf8ff' : '#ffbe4d';
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
    });

    this.particlePool.forEachActive((particle) => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });

    ctx.restore();
  }

  toScreenX(x) {
    return x - this.camera.x;
  }

  toScreenY(y) {
    return y - this.camera.y;
  }
}
