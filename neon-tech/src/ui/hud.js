export class Hud {
  constructor(root) {
    this.root = root;
    this.timer = root.querySelector('#timer');
    this.extraction = root.querySelector('#extraction-status');
    this.loot = root.querySelector('#loot');
    this.credits = root.querySelector('#credits');
    this.health = root.querySelector('#health');
    this.ammo = root.querySelector('#ammo');
    this.reserve = root.querySelector('#reserve');
    this.roleName = root.querySelector('#role-name');
    this.ability = root.querySelector('#ability');
    this.hitMarker = root.querySelector('#hit-marker');
    this.damageFloaters = root.querySelector('#damage-floaters');
    this.minimap = root.querySelector('#minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    this.hitMarkerTimer = 0;
  }

  show() {
    this.root.classList.remove('hidden');
  }

  hide() {
    this.root.classList.add('hidden');
  }

  setHUD({ timeText, extractionText, loot, credits, health, ammo, reserve, role, ability }) {
    this.timer.textContent = timeText;
    this.extraction.textContent = extractionText;
    this.loot.textContent = loot;
    this.credits.textContent = credits;
    this.health.textContent = Math.max(0, Math.round(health));
    this.ammo.textContent = ammo;
    this.reserve.textContent = reserve;
    this.roleName.textContent = `Role: ${role}`;
    this.ability.textContent = `Ability: ${ability}`;
  }

  showHitMarker() {
    this.hitMarkerTimer = 0.2;
    this.hitMarker.classList.remove('hidden');
  }

  addDamageNumber(x, y, value) {
    const span = document.createElement('span');
    span.className = 'damage-number';
    span.textContent = value;
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    this.damageFloaters.appendChild(span);
    setTimeout(() => span.remove(), 800);
  }

  update(dt) {
    if (this.hitMarkerTimer > 0) {
      this.hitMarkerTimer -= dt;
      if (this.hitMarkerTimer <= 0) {
        this.hitMarker.classList.add('hidden');
      }
    }
  }

  drawMinimap(map, player, bots, extraction, ping, scannerRange) {
    const ctx = this.minimapCtx;
    ctx.clearRect(0, 0, this.minimap.width, this.minimap.height);
    const scale = this.minimap.width / map.pixelWidth;
    ctx.save();
    ctx.scale(scale, scale);

    ctx.fillStyle = '#0a101a';
    ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);

    ctx.fillStyle = '#102738';
    map.walls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });

    if (scannerRange) {
      ctx.strokeStyle = 'rgba(44, 248, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, scannerRange, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#2cf8ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff4b7d';
    bots.forEach((bot) => {
      if (!bot.alive) return;
      ctx.fillRect(bot.x - 4, bot.y - 4, 8, 8);
    });

    ctx.strokeStyle = extraction.open ? '#5bff8a' : '#ffbe4d';
    ctx.strokeRect(extraction.x, extraction.y, extraction.w, extraction.h);

    if (ping.active) {
      ctx.strokeStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
