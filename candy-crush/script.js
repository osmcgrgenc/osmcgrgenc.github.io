/**
 * Brick Breaker - Ultra Gelişmiş Retro Arcade Oyunu
 * 
 * Özellikler:
 * - Power-up sistemi (büyük paddle, çoklu top, yavaş top, hızlı paddle)
 * - Özel tuğla tipleri (altın, çoklu vuruş, patlayıcı)
 * - Combo sistemi
 * - Yüksek skor kaydı (localStorage)
 * - Ses efektleri (Web Audio API)
 * - 10 seviye
 */

// ==================== DOM ELEMENTS ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameFrame = document.getElementById("game-frame");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayMessageEl = document.getElementById("overlayMessage");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const comboDisplayEl = document.getElementById("comboDisplay");
const comboCountEl = document.getElementById("comboCount");
const powerUpDisplayEl = document.getElementById("powerUpDisplay");
const powerUpTextEl = document.getElementById("powerUpText");
const achievementNotificationEl = document.getElementById("achievementNotification");
const achievementIconEl = document.getElementById("achievementIcon");
const achievementTitleEl = document.getElementById("achievementTitle");
const achievementDescEl = document.getElementById("achievementDesc");
const achievementCountEl = document.getElementById("achievementCount");
const bossHealthBarEl = document.getElementById("bossHealthBar");
const bossHealthFillEl = document.getElementById("bossHealthFill");
const statsButton = document.getElementById("statsButton");
const statsModal = document.getElementById("statsModal");
const closeStatsBtn = document.getElementById("closeStats");

// ==================== AUDIO SYSTEM ====================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Ses çalma hatası sessizce yok sayılır
  }
}

// ==================== GAME CONFIGURATION ====================
const config = {
  paddleWidthRatio: 0.18,
  paddleHeightRatio: 0.02,
  paddleMarginBottomRatio: 0.05,
  ballRadiusRatio: 0.015,
  
  baseBallSpeed: 5,
  basePaddleSpeed: 8,
  
  brick: {
    heightRatio: 0.03,
    padding: 6,
    offsetTopRatio: 0.08,
    offsetLeftRatio: 0.04,
  },
  
  colorPalettes: [
    ["#ff4b5c", "#ff8c3a", "#ffd93d", "#7ed26c", "#1dd3b0", "#9f7aea"],
    ["#00ffaa", "#00ccff", "#aa66ff", "#ff66aa", "#ffaa00", "#66ffaa"],
    ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"],
    ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"],
    ["#fd79a8", "#fdcb6e", "#00cec9", "#6c5ce7", "#00b894", "#e17055"],
    ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5", "#ffbe0b", "#fb5607"],
    ["#ff0054", "#ff5400", "#ffbd00", "#00d4ff", "#9d4edd", "#c77dff"],
    ["#f72585", "#b5179e", "#7209b7", "#560bad", "#480ca8", "#3a0ca3"],
    ["#ff006e", "#fb5607", "#ff006e", "#8338ec", "#3a86ff", "#06ffa5"],
    ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5", "#ffbe0b", "#fb5607"],
  ],
  
  levels: [
    { rows: 4, columns: 6, speedMultiplier: 1.0, isBoss: false },
    { rows: 5, columns: 7, speedMultiplier: 1.1, isBoss: false },
    { rows: 6, columns: 8, speedMultiplier: 1.2, isBoss: false },
    { rows: 7, columns: 8, speedMultiplier: 1.3, isBoss: false },
    { rows: 8, columns: 9, speedMultiplier: 1.4, isBoss: true }, // Boss 1
    { rows: 8, columns: 10, speedMultiplier: 1.5, isBoss: false },
    { rows: 9, columns: 10, speedMultiplier: 1.6, isBoss: false },
    { rows: 9, columns: 11, speedMultiplier: 1.7, isBoss: false },
    { rows: 10, columns: 11, speedMultiplier: 1.8, isBoss: false },
    { rows: 10, columns: 12, speedMultiplier: 2.0, isBoss: true }, // Boss 2
    { rows: 11, columns: 12, speedMultiplier: 2.1, isBoss: false },
    { rows: 11, columns: 13, speedMultiplier: 2.2, isBoss: false },
    { rows: 12, columns: 13, speedMultiplier: 2.3, isBoss: false },
    { rows: 12, columns: 14, speedMultiplier: 2.4, isBoss: false },
    { rows: 13, columns: 14, speedMultiplier: 2.5, isBoss: true }, // Boss 3
  ],
};

// ==================== GAME STATE ====================
const game = {
  running: false,
  paused: false,
  score: 0,
  highScore: 0,
  lives: 3,
  level: 1,
  bricks: [],
  particles: [],
  activePowerUps: [],
  balls: [],
  keys: { ArrowLeft: false, ArrowRight: false },
  animationId: null,
  lastTime: 0,
  deltaTime: 0,
  
  // Power-up durumları
  powerUps: {
    bigPaddle: { active: false, timer: 0, duration: 10000 },
    slowBall: { active: false, timer: 0, duration: 8000 },
    fastPaddle: { active: false, timer: 0, duration: 10000 },
  },
  
  // Combo sistemi
  combo: {
    count: 0,
    timer: 0,
    maxTime: 2000, // 2 saniye
  },
  
  // Ekran sarsıntısı
  shake: {
    intensity: 0,
    duration: 0,
  },
  
  // Trail sistemi
  ballTrail: [],
  
  // Boss sistemi
  boss: {
    active: false,
    health: 0,
    maxHealth: 0,
    bricks: [],
  },
  
  // İstatistikler
  stats: {
    totalScore: 0,
    bricksBroken: 0,
    maxCombo: 0,
    powerUpsCollected: 0,
    levelsCompleted: 0,
    playTime: 0,
    startTime: 0,
  },
  
  // Achievement sistemi
  achievements: {
    firstBrick: false,
    combo5: false,
    combo10: false,
    combo20: false,
    level5: false,
    level10: false,
    level15: false,
    score1000: false,
    score5000: false,
    score10000: false,
    powerUp10: false,
    boss1: false,
    boss2: false,
    boss3: false,
    perfectLevel: false,
  },
  
  achievementCount: 0,
};

// ==================== DYNAMIC DIMENSIONS ====================
let canvasWidth = 480;
let canvasHeight = 640;
let scale = 1;

let basePaddleWidth, paddleWidth, paddleHeight, paddleX, paddleY, paddleSpeed;
let ballRadius, ballX, ballY, ballDX, ballDY, ballSpeed;
let lastBallX = 0, lastBallY = 0;

// ==================== INITIALIZATION ====================
function init() {
  loadHighScore();
  loadAchievements();
  resizeCanvas();
  window.addEventListener("resize", debounce(resizeCanvas, 100));
  window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 100));
  
  bindEvents();
  initializeGame();
  gameLoop(0);
}

function resizeCanvas() {
  const rect = gameFrame.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  const aspectRatio = 3 / 4;
  let width = rect.width;
  let height = rect.height;
  
  if (width / height > aspectRatio) {
    width = height * aspectRatio;
  } else {
    height = width / aspectRatio;
  }
  
  canvasWidth = Math.floor(width);
  canvasHeight = Math.floor(height);
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + "px";
  canvas.style.height = canvasHeight + "px";
  
  ctx.scale(dpr, dpr);
  scale = canvasWidth / 480;
  
  recalculateDimensions();
  
  if (game.bricks.length > 0) {
    createBrickField();
  }
}

function recalculateDimensions() {
  basePaddleWidth = canvasWidth * config.paddleWidthRatio;
  paddleWidth = basePaddleWidth;
  paddleHeight = Math.max(canvasHeight * config.paddleHeightRatio, 10);
  paddleY = canvasHeight - paddleHeight - (canvasHeight * config.paddleMarginBottomRatio);
  paddleSpeed = config.basePaddleSpeed * scale;
  
  ballRadius = Math.max(canvasWidth * config.ballRadiusRatio, 5);
  ballSpeed = config.baseBallSpeed * scale;
  
  if (paddleX !== undefined) {
    paddleX = Math.min(Math.max(paddleX, 0), canvasWidth - paddleWidth);
  }
  
  // Power-up'lara göre paddle genişliğini ayarla
  if (game.powerUps.bigPaddle.active) {
    paddleWidth = basePaddleWidth * 1.5;
  }
  
  // Power-up'lara göre paddle hızını ayarla
  if (game.powerUps.fastPaddle.active) {
    paddleSpeed = config.basePaddleSpeed * scale * 1.5;
  }
  
  // Power-up'lara göre top hızını ayarla
  if (game.powerUps.slowBall.active) {
    const speedMultiplier = 0.6;
    const currentSpeed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    const newSpeed = ballSpeed * speedMultiplier;
    if (currentSpeed > 0) {
      ballDX = (ballDX / currentSpeed) * newSpeed;
      ballDY = (ballDY / currentSpeed) * newSpeed;
    }
  }
}

function initializeGame() {
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  game.running = false;
  game.paused = false;
  game.particles = [];
  game.activePowerUps = [];
  game.balls = [];
  game.combo.count = 0;
  game.combo.timer = 0;
  game.ballTrail = [];
  game.boss.active = false;
  game.stats.startTime = Date.now();
  
  // Power-up'ları sıfırla
  game.powerUps.bigPaddle.active = false;
  game.powerUps.slowBall.active = false;
  game.powerUps.fastPaddle.active = false;
  
  updateUI();
  createBrickField();
  resetBallAndPaddle();
  showOverlay("🎮 Brick Breaker", "Topu sektirerek tüm tuğlaları kır!\nÖzel tuğlalar ve power-up'ları keşfet!", "Oyunu Başlat", false);
  
  startButton.disabled = false;
  pauseButton.disabled = true;
}

// ==================== EVENT BINDINGS ====================
function bindEvents() {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  restartButton.addEventListener("click", restartGame);
  statsButton.addEventListener("click", () => {
    updateStatsModal();
    statsModal.classList.remove("hidden");
  });
  closeStatsBtn.addEventListener("click", () => {
    statsModal.classList.add("hidden");
  });
  statsModal.addEventListener("click", (e) => {
    if (e.target === statsModal) {
      statsModal.classList.add("hidden");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.running && !game.paused) {
      togglePause();
    }
  });
}

function handleKeyDown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    if (!game.running) {
      startGame();
    } else {
      togglePause();
    }
  }
  if (event.code in game.keys) {
    game.keys[event.code] = true;
  }
}

function handleKeyUp(event) {
  if (event.code in game.keys) {
    game.keys[event.code] = false;
  }
}

function handleMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  const scaleX = canvasWidth / rect.width;
  
  if (relativeX >= 0 && relativeX <= rect.width) {
    const targetX = relativeX * scaleX - paddleWidth / 2;
    paddleX = clamp(targetX, 0, canvasWidth - paddleWidth);
    
    if (!game.running || game.paused) {
      ballX = paddleX + paddleWidth / 2;
    }
  }
}

function handleCanvasClick() {
  if (!game.running) {
    startGame();
  }
}

let touchStartX = 0;
let touchPaddleStartX = 0;

function handleTouchStart(event) {
  event.preventDefault();
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchPaddleStartX = paddleX;
    
    if (!game.running) {
      startGame();
    }
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const scaleX = canvasWidth / rect.width;
    
    const deltaX = (currentX - touchStartX) * scaleX;
    const targetX = touchPaddleStartX + deltaX;
    paddleX = clamp(targetX, 0, canvasWidth - paddleWidth);
    
    if (!game.running || game.paused) {
      ballX = paddleX + paddleWidth / 2;
    }
  }
}

function handleTouchEnd(event) {
  event.preventDefault();
}

// ==================== GAME CONTROL ====================
function startGame() {
  if (game.running && !game.paused) return;
  
  hideOverlay();
  game.running = true;
  game.paused = false;
  
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.innerHTML = '<span class="btn-icon">⏸</span> Duraklat';
  
  playSound(200, 0.1);
}

function togglePause() {
  if (!game.running) return;
  
  game.paused = !game.paused;
  
  if (game.paused) {
    pauseButton.innerHTML = '<span class="btn-icon">▶</span> Devam';
    showOverlay("⏸ Duraklatıldı", "Devam etmek için Space tuşuna bas veya butona tıkla.", "Devam Et", false);
  } else {
    pauseButton.innerHTML = '<span class="btn-icon">⏸</span> Duraklat';
    hideOverlay();
  }
}

function restartGame() {
  initializeGame();
  startGame();
}

// ==================== GAME LOOP ====================
function gameLoop(timestamp) {
  game.deltaTime = Math.min((timestamp - game.lastTime) / 16.67, 2);
  game.lastTime = timestamp;
  
  // Ekran sarsıntısı
  let offsetX = 0, offsetY = 0;
  if (game.shake.duration > 0) {
    offsetX = (Math.random() - 0.5) * game.shake.intensity;
    offsetY = (Math.random() - 0.5) * game.shake.intensity;
    game.shake.duration -= 16.67 * game.deltaTime;
  }
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawBackground();
  drawBricks();
  drawBoss();
  drawPowerUps();
  drawPaddle();
  drawBallTrail();
  drawBalls();
  drawParticles();
  
  ctx.restore();
  
  handlePaddleMovement();
  updatePowerUps();
  updateCombo();
  
  if (game.running && !game.paused) {
    updateBalls();
    handleWallCollisions();
    handlePaddleCollision();
    handleBrickCollisions();
    handlePowerUpCollisions();
    updateParticles();
  }
  
  game.animationId = requestAnimationFrame(gameLoop);
}

// ==================== DRAWING FUNCTIONS ====================
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#0a0a2a");
  gradient.addColorStop(0.5, "#0f0f3a");
  gradient.addColorStop(1, "#050515");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.strokeStyle = "rgba(100, 100, 255, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 30 * scale;
  
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function drawPaddle() {
  ctx.shadowColor = "#00ffaa";
  ctx.shadowBlur = 15 * scale;
  
  const gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + paddleHeight);
  gradient.addColorStop(0, "#00ffcc");
  gradient.addColorStop(0.5, "#00ffaa");
  gradient.addColorStop(1, "#00cc88");
  
  ctx.fillStyle = gradient;
  roundRect(ctx, paddleX, paddleY, paddleWidth, paddleHeight, 4 * scale);
  ctx.fill();
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  roundRect(ctx, paddleX + 2, paddleY + 2, paddleWidth - 4, paddleHeight / 3, 2 * scale);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawBalls() {
  // Ana top
  drawSingleBall(ballX, ballY);
  
  // Ekstra toplar (çoklu top power-up)
  for (const extraBall of game.balls) {
    drawSingleBall(extraBall.x, extraBall.y);
  }
}

// Trail efekti çizimi
function drawBallTrail() {
  for (let i = 0; i < game.ballTrail.length; i++) {
    const point = game.ballTrail[i];
    const alpha = point.life / 10;
    ctx.globalAlpha = alpha * 0.5;
    
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, ballRadius * 1.5
    );
    gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 170, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, ballRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSingleBall(x, y) {
  ctx.shadowColor = "#ffff00";
  ctx.shadowBlur = 20 * scale;
  
  const gradient = ctx.createRadialGradient(
    x - ballRadius * 0.3, y - ballRadius * 0.3, 0,
    x, y, ballRadius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.3, "#ffff66");
  gradient.addColorStop(1, "#ffaa00");
  
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
  
  ctx.shadowBlur = 0;
}

function drawBricks() {
  const palette = config.colorPalettes[(game.level - 1) % config.colorPalettes.length];
  
  for (let row = 0; row < game.bricks.length; row++) {
    for (let col = 0; col < game.bricks[row].length; col++) {
      const brick = game.bricks[row][col];
      if (!brick.active) continue;
      
      let color = palette[row % palette.length];
      const { x, y, width, height, type } = brick;
      
      // Özel tuğla tipleri
      if (type === 'gold') {
        color = "#ffd700";
        drawGoldBrick(x, y, width, height);
      } else if (type === 'multi') {
        color = "#c0c0c0";
        drawMultiHitBrick(x, y, width, height, brick.hits);
      } else if (type === 'explosive') {
        color = "#ff0000";
        drawExplosiveBrick(x, y, width, height);
      } else if (type === 'ice') {
        color = "#00ccff";
        drawIceBrick(x, y, width, height);
      } else if (type === 'magnetic') {
        color = "#ff00ff";
        drawMagneticBrick(x, y, width, height);
      } else {
        drawNormalBrick(x, y, width, height, color);
      }
    }
  }
}

function drawNormalBrick(x, y, width, height, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * scale;
  
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  roundRect(ctx, x + 2, y + 2, width - 4, height / 3, 2 * scale);
  ctx.fill();
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  roundRect(ctx, x + 2, y + height - height / 3, width - 4, height / 3 - 2, 2 * scale);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawGoldBrick(x, y, width, height) {
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 15 * scale;
  
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, "#ffed4e");
  gradient.addColorStop(0.5, "#ffd700");
  gradient.addColorStop(1, "#b8860b");
  
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  // Altın parıltı efekti
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  roundRect(ctx, x + 2, y + 2, width - 4, height / 2, 2 * scale);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawMultiHitBrick(x, y, width, height, hits) {
  const color = hits === 3 ? "#c0c0c0" : hits === 2 ? "#808080" : "#404040";
  
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * scale;
  
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  // Vuruş sayısını göster
  ctx.fillStyle = "#ffffff";
  ctx.font = `${10 * scale}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-pixel')}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hits.toString(), x + width / 2, y + height / 2);
  
  ctx.shadowBlur = 0;
}

function drawExplosiveBrick(x, y, width, height) {
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 12 * scale;
  
  const gradient = ctx.createRadialGradient(
    x + width / 2, y + height / 2, 0,
    x + width / 2, y + height / 2, Math.max(width, height) / 2
  );
  gradient.addColorStop(0, "#ff6666");
  gradient.addColorStop(0.5, "#ff0000");
  gradient.addColorStop(1, "#990000");
  
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  // Patlama işareti
  ctx.fillStyle = "#ffffff";
  ctx.font = `${12 * scale}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-pixel')}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💣", x + width / 2, y + height / 2);
  
  ctx.shadowBlur = 0;
}

function drawIceBrick(x, y, width, height) {
  ctx.shadowColor = "#00ccff";
  ctx.shadowBlur = 10 * scale;
  
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.5, "#00ccff");
  gradient.addColorStop(1, "#0088cc");
  
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  // Buz efekti
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  roundRect(ctx, x + 2, y + 2, width - 4, height / 2, 2 * scale);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawMagneticBrick(x, y, width, height) {
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 10 * scale;
  
  const gradient = ctx.createRadialGradient(
    x + width / 2, y + height / 2, 0,
    x + width / 2, y + height / 2, Math.max(width, height)
  );
  gradient.addColorStop(0, "#ff66ff");
  gradient.addColorStop(0.5, "#ff00ff");
  gradient.addColorStop(1, "#990099");
  
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, width, height, 3 * scale);
  ctx.fill();
  
  // Manyetik alan efekti
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.shadowBlur = 0;
}

function drawBoss() {
  if (!game.boss.active) return;
  
  // Boss tuğlalarını çiz
  for (const brick of game.boss.bricks) {
    if (!brick.active) continue;
    
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15 * scale;
    
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    gradient.addColorStop(0, "#ff6666");
    gradient.addColorStop(0.5, "#ff0000");
    gradient.addColorStop(1, "#990000");
    
    ctx.fillStyle = gradient;
    roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4 * scale);
    ctx.fill();
    
    // Boss işareti
    ctx.fillStyle = "#ffffff";
    ctx.font = `${10 * scale}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-pixel')}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👹", brick.x + brick.width / 2, brick.y + brick.height / 2);
    
    ctx.shadowBlur = 0;
  }
  
  // Health bar güncelle
  const healthPercent = (game.boss.health / game.boss.maxHealth) * 100;
  bossHealthFillEl.style.width = healthPercent + "%";
}

function drawPowerUps() {
  for (const powerUp of game.activePowerUps) {
    if (!powerUp.active) continue;
    
    ctx.shadowColor = powerUp.color;
    ctx.shadowBlur = 10 * scale;
    
    // Power-up gövdesi
    ctx.fillStyle = powerUp.color;
    roundRect(ctx, powerUp.x, powerUp.y, powerUp.width, powerUp.height, 4 * scale);
    ctx.fill();
    
    // İkon
    ctx.fillStyle = "#ffffff";
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(powerUp.icon, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
    
    ctx.shadowBlur = 0;
  }
}

function drawParticles() {
  for (const p of game.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ==================== BRICK MANAGEMENT ====================
function createBrickField() {
  game.bricks = [];
  
  const levelConfig = config.levels[Math.min(game.level - 1, config.levels.length - 1)];
  const { rows, columns, isBoss } = levelConfig;
  
  // Boss seviyesi kontrolü
  if (isBoss) {
    createBossLevel();
    return;
  }
  
  const offsetLeft = canvasWidth * config.brick.offsetLeftRatio;
  const offsetTop = canvasHeight * config.brick.offsetTopRatio;
  const padding = config.brick.padding * scale;
  const brickHeight = canvasHeight * config.brick.heightRatio;
  
  const totalPaddingX = padding * (columns - 1);
  const brickWidth = (canvasWidth - offsetLeft * 2 - totalPaddingX) / columns;
  
  for (let row = 0; row < rows; row++) {
    const rowArray = [];
    for (let col = 0; col < columns; col++) {
      const x = offsetLeft + col * (brickWidth + padding);
      const y = offsetTop + row * (brickHeight + padding);
      
      // Özel tuğla tiplerini rastgele dağıt
      let type = 'normal';
      const rand = Math.random();
      
      if (rand < 0.05 && row > 0) {
        // %5 altın tuğla
        type = 'gold';
      } else if (rand < 0.10 && row > 1) {
        // %5 çoklu vuruş tuğla
        type = 'multi';
      } else if (rand < 0.15 && row > 2) {
        // %5 patlayıcı tuğla
        type = 'explosive';
      } else if (rand < 0.20 && row > 2) {
        // %5 buz tuğla
        type = 'ice';
      } else if (rand < 0.25 && row > 3) {
        // %5 manyetik tuğla
        type = 'magnetic';
      }
      
      const brick = {
        x,
        y,
        width: brickWidth,
        height: brickHeight,
        active: true,
        type,
        hits: type === 'multi' ? 3 : 1,
      };
      
      rowArray.push(brick);
    }
    game.bricks.push(rowArray);
  }
}

// ==================== BALL & PADDLE CONTROL ====================
function resetBallAndPaddle() {
  paddleX = (canvasWidth - paddleWidth) / 2;
  ballX = paddleX + paddleWidth / 2;
  ballY = paddleY - ballRadius - 5;
  
  const angle = ((Math.random() * 30 + 30) * Math.PI) / 180;
  const direction = Math.random() < 0.5 ? -1 : 1;
  
  const levelConfig = config.levels[Math.min(game.level - 1, config.levels.length - 1)];
  let currentSpeed = ballSpeed * levelConfig.speedMultiplier;
  
  if (game.powerUps.slowBall.active) {
    currentSpeed *= 0.6;
  }
  
  ballDX = Math.cos(angle) * currentSpeed * direction;
  ballDY = -Math.sin(angle) * currentSpeed;
  
  game.balls = [];
}

function updateBalls() {
  // Trail ekle
  if (Math.abs(ballX - lastBallX) > 2 || Math.abs(ballY - lastBallY) > 2) {
    game.ballTrail.push({ x: ballX, y: ballY, life: 10 });
    lastBallX = ballX;
    lastBallY = ballY;
  }
  
  // Trail güncelle
  for (let i = game.ballTrail.length - 1; i >= 0; i--) {
    game.ballTrail[i].life -= 0.5 * game.deltaTime;
    if (game.ballTrail[i].life <= 0) {
      game.ballTrail.splice(i, 1);
    }
  }
  
  // Ana top
  ballX += ballDX * game.deltaTime;
  ballY += ballDY * game.deltaTime;
  
  // Manyetik tuğla efekti
  applyMagneticEffect();
  
  // Ekstra toplar
  for (let i = game.balls.length - 1; i >= 0; i--) {
    const ball = game.balls[i];
    ball.x += ball.dx * game.deltaTime;
    ball.y += ball.dy * game.deltaTime;
    
    // Ekstra top ekranın dışına çıkarsa kaldır
    if (ball.y - ballRadius > canvasHeight) {
      game.balls.splice(i, 1);
    }
  }
}

function applyMagneticEffect() {
  // Manyetik tuğlalara yakınken topu çek
  for (let row = 0; row < game.bricks.length; row++) {
    for (let col = 0; col < game.bricks[row].length; col++) {
      const brick = game.bricks[row][col];
      if (!brick.active || brick.type !== 'magnetic') continue;
      
      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      const dx = brickCenterX - ballX;
      const dy = brickCenterY - ballY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100 * scale && distance > 0) {
        const force = 0.3 * scale / (distance / 10);
        ballDX += (dx / distance) * force * game.deltaTime;
        ballDY += (dy / distance) * force * game.deltaTime;
      }
    }
  }
}

function handlePaddleMovement() {
  const speed = paddleSpeed * game.deltaTime;
  
  if (game.keys.ArrowLeft) {
    paddleX = Math.max(paddleX - speed, 0);
    if (!game.running || game.paused) {
      ballX = paddleX + paddleWidth / 2;
    }
  }
  if (game.keys.ArrowRight) {
    paddleX = Math.min(paddleX + speed, canvasWidth - paddleWidth);
    if (!game.running || game.paused) {
      ballX = paddleX + paddleWidth / 2;
    }
  }
}

// ==================== COLLISION DETECTION ====================
function handleWallCollisions() {
  // Ana top
  if (ballX + ballRadius >= canvasWidth) {
    ballX = canvasWidth - ballRadius;
    ballDX = -Math.abs(ballDX);
    playSound(300, 0.05);
  }
  if (ballX - ballRadius <= 0) {
    ballX = ballRadius;
    ballDX = Math.abs(ballDX);
    playSound(300, 0.05);
  }
  if (ballY - ballRadius <= 0) {
    ballY = ballRadius;
    ballDY = Math.abs(ballDY);
    playSound(300, 0.05);
  }
  if (ballY - ballRadius > canvasHeight) {
    loseLife();
    return;
  }
  
  // Ekstra toplar
  for (const ball of game.balls) {
    if (ball.x + ballRadius >= canvasWidth) {
      ball.x = canvasWidth - ballRadius;
      ball.dx = -Math.abs(ball.dx);
    }
    if (ball.x - ballRadius <= 0) {
      ball.x = ballRadius;
      ball.dx = Math.abs(ball.dx);
    }
    if (ball.y - ballRadius <= 0) {
      ball.y = ballRadius;
      ball.dy = Math.abs(ball.dy);
    }
  }
}

function handlePaddleCollision() {
  // Ana top
  if (
    ballY + ballRadius >= paddleY &&
    ballY - ballRadius <= paddleY + paddleHeight &&
    ballX >= paddleX - ballRadius &&
    ballX <= paddleX + paddleWidth + ballRadius &&
    ballDY > 0
  ) {
    const collidePoint = ballX - (paddleX + paddleWidth / 2);
    const normalized = collidePoint / (paddleWidth / 2);
    const maxBounceAngle = (70 * Math.PI) / 180;
    const bounceAngle = normalized * maxBounceAngle;
    
    const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    ballDX = speed * Math.sin(bounceAngle);
    ballDY = -Math.abs(speed * Math.cos(bounceAngle));
    
    ballY = paddleY - ballRadius - 1;
    createParticles(ballX, paddleY, "#00ffaa", 5);
    playSound(400, 0.1);
  }
  
  // Ekstra toplar
  for (const ball of game.balls) {
    if (
      ball.y + ballRadius >= paddleY &&
      ball.y - ballRadius <= paddleY + paddleHeight &&
      ball.x >= paddleX - ballRadius &&
      ball.x <= paddleX + paddleWidth + ballRadius &&
      ball.dy > 0
    ) {
      const collidePoint = ball.x - (paddleX + paddleWidth / 2);
      const normalized = collidePoint / (paddleWidth / 2);
      const maxBounceAngle = (70 * Math.PI) / 180;
      const bounceAngle = normalized * maxBounceAngle;
      
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = speed * Math.sin(bounceAngle);
      ball.dy = -Math.abs(speed * Math.cos(bounceAngle));
      
      ball.y = paddleY - ballRadius - 1;
    }
  }
}

function handleBrickCollisions() {
  const palette = config.colorPalettes[(game.level - 1) % config.colorPalettes.length];
  
  // Ana top
  checkBallBrickCollision(ballX, ballY, ballDX, ballDY, true);
  
  // Ekstra toplar
  for (const ball of game.balls) {
    checkBallBrickCollision(ball.x, ball.y, ball.dx, ball.dy, false, ball);
  }
}

function checkBallBrickCollision(ballXPos, ballYPos, ballDXVal, ballDYVal, isMainBall, ballObj = null) {
  const palette = config.colorPalettes[(game.level - 1) % config.colorPalettes.length];
  
  for (let row = 0; row < game.bricks.length; row++) {
    for (let col = 0; col < game.bricks[row].length; col++) {
      const brick = game.bricks[row][col];
      if (!brick.active) continue;
      
      if (
        ballXPos + ballRadius > brick.x &&
        ballXPos - ballRadius < brick.x + brick.width &&
        ballYPos + ballRadius > brick.y &&
        ballYPos - ballRadius < brick.y + brick.height
      ) {
        // Çoklu vuruş tuğla kontrolü
        if (brick.type === 'multi') {
          brick.hits--;
          if (brick.hits > 0) {
            playSound(250, 0.1);
            // Sadece sekme, kırma
            const overlapLeft = ballXPos + ballRadius - brick.x;
            const overlapRight = brick.x + brick.width - (ballXPos - ballRadius);
            const overlapTop = ballYPos + ballRadius - brick.y;
            const overlapBottom = brick.y + brick.height - (ballYPos - ballRadius);
            
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            if (isMainBall) {
              if (minOverlapX < minOverlapY) {
                ballDX = -ballDX;
              } else {
                ballDY = -ballDY;
              }
            } else {
              if (minOverlapX < minOverlapY) {
                ballObj.dx = -ballObj.dx;
              } else {
                ballObj.dy = -ballObj.dy;
              }
            }
            return;
          }
        }
        
        // Buz tuğla - topu yavaşlatır
        if (brick.type === 'ice') {
          const speed = Math.sqrt(ballDXVal * ballDXVal + ballDYVal * ballDYVal);
          if (speed > ballSpeed * 0.5) {
            const slowFactor = 0.7;
            if (isMainBall) {
              ballDX *= slowFactor;
              ballDY *= slowFactor;
            } else {
              ballObj.dx *= slowFactor;
              ballObj.dy *= slowFactor;
            }
          }
        }
        
        // Tuğlayı kır
        brick.active = false;
        
        // Combo sistemi
        game.combo.count++;
        game.combo.timer = game.combo.maxTime;
        showCombo();
        
        // Skor hesaplama
        let points = 10 * game.level;
        if (brick.type === 'gold') {
          points *= 5;
        } else if (brick.type === 'explosive') {
          points *= 2;
        }
        
        // Combo bonusu
        if (game.combo.count > 1) {
          points += game.combo.count * 5;
        }
        
        game.score += points;
        game.stats.totalScore += points;
        game.stats.bricksBroken++;
        
        // Achievement kontrolü
        checkAchievement('firstBrick');
        if (game.combo.count >= 5) checkAchievement('combo5');
        if (game.combo.count >= 10) checkAchievement('combo10');
        if (game.combo.count >= 20) checkAchievement('combo20');
        if (game.score >= 1000) checkAchievement('score1000');
        if (game.score >= 5000) checkAchievement('score5000');
        if (game.score >= 10000) checkAchievement('score10000');
        
        // Yüksek skor kontrolü
        if (game.score > game.highScore) {
          game.highScore = game.score;
          saveHighScore();
        }
        
        // Max combo güncelle
        if (game.combo.count > game.stats.maxCombo) {
          game.stats.maxCombo = game.combo.count;
        }
        
        updateUI();
        
        // Patlayıcı tuğla efekti
        if (brick.type === 'explosive') {
          explodeBricks(row, col);
          game.shake.intensity = 5;
          game.shake.duration = 200;
          playSound(100, 0.2, 'sawtooth');
        }
        
        // Power-up düşürme şansı (%15)
        if (Math.random() < 0.15 && brick.type !== 'multi') {
          dropPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
        
        // Çarpışma yönünü belirle
        const overlapLeft = ballXPos + ballRadius - brick.x;
        const overlapRight = brick.x + brick.width - (ballXPos - ballRadius);
        const overlapTop = ballYPos + ballRadius - brick.y;
        const overlapBottom = brick.y + brick.height - (ballYPos - ballRadius);
        
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        
        if (isMainBall) {
          if (minOverlapX < minOverlapY) {
            ballDX = -ballDX;
          } else {
            ballDY = -ballDY;
          }
        } else {
          if (minOverlapX < minOverlapY) {
            ballObj.dx = -ballObj.dx;
          } else {
            ballObj.dy = -ballObj.dy;
          }
        }
        
        // Parçacık efekti
        const color = brick.type === 'gold' ? "#ffd700" : palette[row % palette.length];
        createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, color, 15);
        
        playSound(500 + game.combo.count * 50, 0.1);
        
        checkWinCondition();
        return;
      }
    }
  }
  
  // Boss tuğlaları kontrolü
  if (game.boss.active) {
    checkBossBrickCollision(ballXPos, ballYPos, ballDXVal, ballDYVal, isMainBall, ballObj);
  }
}

function checkBossBrickCollision(ballXPos, ballYPos, ballDXVal, ballDYVal, isMainBall, ballObj) {
  for (let i = game.boss.bricks.length - 1; i >= 0; i--) {
    const brick = game.boss.bricks[i];
    if (!brick.active) continue;
    
    if (
      ballXPos + ballRadius > brick.x &&
      ballXPos - ballRadius < brick.x + brick.width &&
      ballYPos + ballRadius > brick.y &&
      ballYPos - ballRadius < brick.y + brick.height
    ) {
      brick.active = false;
      game.boss.health--;
      game.stats.bricksBroken++;
      
      let points = 50 * game.level;
      game.score += points;
      
      if (game.score > game.highScore) {
        game.highScore = game.score;
        saveHighScore();
      }
      
      updateUI();
      
      // Çarpışma yönü
      const overlapLeft = ballXPos + ballRadius - brick.x;
      const overlapRight = brick.x + brick.width - (ballXPos - ballRadius);
      const overlapTop = ballYPos + ballRadius - brick.y;
      const overlapBottom = brick.y + brick.height - (ballYPos - ballRadius);
      
      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);
      
      if (isMainBall) {
        if (minOverlapX < minOverlapY) {
          ballDX = -ballDX;
        } else {
          ballDY = -ballDY;
        }
      } else {
        if (minOverlapX < minOverlapY) {
          ballObj.dx = -ballObj.dx;
        } else {
          ballObj.dy = -ballObj.dy;
        }
      }
      
      createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, "#ff0000", 20);
      playSound(300, 0.15);
      
      // Boss yenildi mi?
      if (game.boss.health <= 0) {
        defeatBoss();
      }
      
      return;
    }
  }
}

function createBossLevel() {
  game.boss.active = true;
  game.bricks = [];
  
  const levelConfig = config.levels[Math.min(game.level - 1, config.levels.length - 1)];
  const { rows, columns } = levelConfig;
  
  const offsetLeft = canvasWidth * config.brick.offsetLeftRatio;
  const offsetTop = canvasHeight * config.brick.offsetTopRatio;
  const padding = config.brick.padding * scale;
  const brickHeight = canvasHeight * config.brick.heightRatio;
  
  const totalPaddingX = padding * (columns - 1);
  const brickWidth = (canvasWidth - offsetLeft * 2 - totalPaddingX) / columns;
  
  // Normal tuğlalar
  for (let row = 0; row < rows - 2; row++) {
    const rowArray = [];
    for (let col = 0; col < columns; col++) {
      const x = offsetLeft + col * (brickWidth + padding);
      const y = offsetTop + row * (brickHeight + padding);
      rowArray.push({
        x,
        y,
        width: brickWidth,
        height: brickHeight,
        active: true,
        type: 'normal',
        hits: 1,
      });
    }
    game.bricks.push(rowArray);
  }
  
  // Boss tuğlaları (son 2 satır)
  game.boss.bricks = [];
  const bossRows = 2;
  const bossStartRow = rows - bossRows;
  
  for (let row = 0; row < bossRows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = offsetLeft + col * (brickWidth + padding);
      const y = offsetTop + (bossStartRow + row) * (brickHeight + padding);
      game.boss.bricks.push({
        x,
        y,
        width: brickWidth,
        height: brickHeight,
        active: true,
        type: 'boss',
        hits: 1,
      });
    }
  }
  
  game.boss.maxHealth = game.boss.bricks.length;
  game.boss.health = game.boss.maxHealth;
  
  bossHealthBarEl.classList.remove("hidden");
  
  showOverlay("👹 BOSS SEVİYESİ!", `Güçlü boss ile savaş! Tüm boss tuğlalarını kır!`, "Savaşa Başla", false);
  playSound(200, 0.3, 'sawtooth');
}

function defeatBoss() {
  game.boss.active = false;
  bossHealthBarEl.classList.add("hidden");
  
  // Bonus puan
  game.score += 1000 * game.level;
  game.stats.bricksBroken += game.boss.maxHealth;
  
  checkAchievement('boss' + Math.ceil(game.level / 5));
  
  showOverlay("👹 BOSS YENİLDİ!", `Harika iş! Boss'u yendin!\nBonus: ${1000 * game.level} puan`, "Devam Et", false);
  playSound(1000, 0.5);
  
  updateUI();
}

function explodeBricks(centerRow, centerCol) {
  // Çevredeki tuğlaları patlat
  for (let row = Math.max(0, centerRow - 1); row <= Math.min(game.bricks.length - 1, centerRow + 1); row++) {
    for (let col = Math.max(0, centerCol - 1); col <= Math.min(game.bricks[row].length - 1, centerCol + 1); col++) {
      if (row === centerRow && col === centerCol) continue;
      
      const brick = game.bricks[row][col];
      if (brick && brick.active) {
        brick.active = false;
        game.score += 5 * game.level;
        const palette = config.colorPalettes[(game.level - 1) % config.colorPalettes.length];
        createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, palette[row % palette.length], 8);
      }
    }
  }
}

// ==================== POWER-UP SYSTEM ====================
function dropPowerUp(x, y) {
  const types = ['bigPaddle', 'slowBall', 'fastPaddle', 'multiBall'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const icons = {
    bigPaddle: '📏',
    slowBall: '🐌',
    fastPaddle: '⚡',
    multiBall: '⚽',
  };
  
  const colors = {
    bigPaddle: '#00ffaa',
    slowBall: '#00ccff',
    fastPaddle: '#ffaa00',
    multiBall: '#ff00ff',
  };
  
  game.activePowerUps.push({
    x,
    y,
    width: 30 * scale,
    height: 30 * scale,
    type,
    icon: icons[type],
    color: colors[type],
    active: true,
    vy: 2 * scale,
  });
}

function handlePowerUpCollisions() {
  for (let i = game.activePowerUps.length - 1; i >= 0; i--) {
    const powerUp = game.activePowerUps[i];
    if (!powerUp.active) continue;
    
    // Power-up paddle'a çarptı mı?
    if (
      powerUp.y + powerUp.height >= paddleY &&
      powerUp.y <= paddleY + paddleHeight &&
      powerUp.x + powerUp.width >= paddleX &&
      powerUp.x <= paddleX + paddleWidth
    ) {
      activatePowerUp(powerUp.type);
      game.activePowerUps.splice(i, 1);
      game.stats.powerUpsCollected++;
      playSound(600, 0.2);
      
      if (game.stats.powerUpsCollected >= 10) {
        checkAchievement('powerUp10');
      }
      
      continue;
    }
    
    // Power-up ekranın dışına çıktı mı?
    if (powerUp.y > canvasHeight) {
      game.activePowerUps.splice(i, 1);
    }
  }
}

function activatePowerUp(type) {
  if (type === 'bigPaddle') {
    game.powerUps.bigPaddle.active = true;
    game.powerUps.bigPaddle.timer = game.powerUps.bigPaddle.duration;
    paddleWidth = basePaddleWidth * 1.5;
    showPowerUp("Büyük Paddle!");
  } else if (type === 'slowBall') {
    game.powerUps.slowBall.active = true;
    game.powerUps.slowBall.timer = game.powerUps.slowBall.duration;
    showPowerUp("Yavaş Top!");
  } else if (type === 'fastPaddle') {
    game.powerUps.fastPaddle.active = true;
    game.powerUps.fastPaddle.timer = game.powerUps.fastPaddle.duration;
    paddleSpeed = config.basePaddleSpeed * scale * 1.5;
    showPowerUp("Hızlı Paddle!");
  } else if (type === 'multiBall') {
    // Çoklu top
    const angle1 = ((Math.random() * 30 + 30) * Math.PI) / 180;
    const angle2 = ((Math.random() * 30 + 30) * Math.PI) / 180;
    const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    
    game.balls.push({
      x: ballX,
      y: ballY,
      dx: Math.cos(angle1) * speed,
      dy: -Math.abs(Math.sin(angle1) * speed),
    });
    
    game.balls.push({
      x: ballX,
      y: ballY,
      dx: Math.cos(angle2) * speed * -1,
      dy: -Math.abs(Math.sin(angle2) * speed),
    });
    
    showPowerUp("Çoklu Top!");
  }
}

function updatePowerUps() {
  // Power-up'ları hareket ettir
  for (const powerUp of game.activePowerUps) {
    if (powerUp.active) {
      powerUp.y += powerUp.vy * game.deltaTime;
    }
  }
  
  // Aktif power-up timer'larını güncelle
  const deltaMs = game.deltaTime * 16.67;
  
  if (game.powerUps.bigPaddle.active) {
    game.powerUps.bigPaddle.timer -= deltaMs;
    if (game.powerUps.bigPaddle.timer <= 0) {
      game.powerUps.bigPaddle.active = false;
      paddleWidth = basePaddleWidth;
      hidePowerUp();
    }
  }
  
  if (game.powerUps.slowBall.active) {
    game.powerUps.slowBall.timer -= deltaMs;
    if (game.powerUps.slowBall.timer <= 0) {
      game.powerUps.slowBall.active = false;
      hidePowerUp();
    }
  }
  
  if (game.powerUps.fastPaddle.active) {
    game.powerUps.fastPaddle.timer -= deltaMs;
    if (game.powerUps.fastPaddle.timer <= 0) {
      game.powerUps.fastPaddle.active = false;
      paddleSpeed = config.basePaddleSpeed * scale;
      hidePowerUp();
    }
  }
}

function showPowerUp(text) {
  powerUpTextEl.textContent = text;
  powerUpDisplayEl.classList.remove("hidden");
  setTimeout(() => {
    powerUpDisplayEl.classList.add("hidden");
  }, 2000);
}

function hidePowerUp() {
  powerUpDisplayEl.classList.add("hidden");
}

// ==================== COMBO SYSTEM ====================
function updateCombo() {
  if (game.combo.timer > 0) {
    game.combo.timer -= 16.67 * game.deltaTime;
    if (game.combo.timer <= 0) {
      game.combo.count = 0;
      comboDisplayEl.classList.add("hidden");
    }
  }
}

function showCombo() {
  if (game.combo.count > 1) {
    comboCountEl.textContent = game.combo.count;
    comboDisplayEl.classList.remove("hidden");
  } else {
    comboDisplayEl.classList.add("hidden");
  }
}

// ==================== PARTICLE SYSTEM ====================
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      color,
      life: 1,
      decay: Math.random() * 0.03 + 0.02,
    });
  }
}

function updateParticles() {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * game.deltaTime;
    p.y += p.vy * game.deltaTime;
    p.vy += 0.1 * game.deltaTime;
    p.life -= p.decay * game.deltaTime;
    
    if (p.life <= 0) {
      game.particles.splice(i, 1);
    }
  }
}

// ==================== GAME STATE MANAGEMENT ====================
function loseLife() {
  game.lives--;
  game.combo.count = 0;
  comboDisplayEl.classList.add("hidden");
  updateUI();
  game.running = false;
  
  if (game.lives <= 0) {
    endGame(false);
    return;
  }
  
  resetBallAndPaddle();
  showOverlay("💔 Can Kaybettin!", `Kalan can: ${game.lives}. Devam etmek için hazır ol.`, "Devam Et", false);
  
  startButton.disabled = false;
  pauseButton.disabled = true;
  
  playSound(150, 0.3);
}

function checkWinCondition() {
  const allCleared = game.bricks.every((row) => row.every((brick) => !brick.active));
  const bossDefeated = !game.boss.active || game.boss.health <= 0;
  
  if (allCleared && bossDefeated) {
    game.running = false;
    game.stats.levelsCompleted++;
    
    // Achievement kontrolü
    if (game.level === 5) checkAchievement('level5');
    if (game.level === 10) checkAchievement('level10');
    if (game.level === 15) checkAchievement('level15');
    
    // Perfect level kontrolü (can kaybetmeden)
    if (game.lives === 3) {
      checkAchievement('perfectLevel');
    }
    
    if (game.level < config.levels.length) {
      game.level++;
      createBrickField();
      resetBallAndPaddle();
      updateUI();
      showOverlay(`🎉 Seviye ${game.level - 1} Tamamlandı!`, `Yeni seviye: ${game.level}. Hazır ol!`, "Sonraki Seviye", false);
      startButton.disabled = false;
      pauseButton.disabled = true;
      playSound(800, 0.3);
    } else {
      endGame(true);
    }
  }
}

function endGame(won) {
  game.running = false;
  
  if (won) {
    showOverlay("🏆 TEBRİKLER!", `Tüm seviyeleri tamamladın!\nToplam Skor: ${game.score}`, "Tekrar Oyna", true);
    overlayTitleEl.classList.add("win");
    overlayTitleEl.classList.remove("lose");
    playSound(1000, 0.5);
  } else {
    showOverlay("💀 GAME OVER", `Skor: ${game.score}\nSeviye: ${game.level}`, "Tekrar Oyna", true);
    overlayTitleEl.classList.add("lose");
    overlayTitleEl.classList.remove("win");
  }
  
  startButton.disabled = true;
  pauseButton.disabled = true;
}

// ==================== UI UPDATES ====================
function updateUI() {
  scoreEl.textContent = game.score;
  highScoreEl.textContent = game.highScore;
  levelEl.textContent = game.level;
  achievementCountEl.textContent = game.achievementCount;
  
  const hearts = livesEl.querySelectorAll(".heart");
  hearts.forEach((heart, index) => {
    if (index < game.lives) {
      heart.classList.remove("lost");
    } else {
      heart.classList.add("lost");
    }
  });
}

function checkAchievement(id) {
  if (game.achievements[id]) return; // Zaten kazanılmış
  
  game.achievements[id] = true;
  game.achievementCount++;
  
  const achievements = {
    firstBrick: { icon: "🎯", title: "İlk Tuğla", desc: "İlk tuğlayı kır" },
    combo5: { icon: "🔥", title: "Combo Master", desc: "5 combo yap" },
    combo10: { icon: "⚡", title: "Combo Pro", desc: "10 combo yap" },
    combo20: { icon: "💥", title: "Combo Legend", desc: "20 combo yap" },
    level5: { icon: "⭐", title: "Seviye 5", desc: "5. seviyeyi tamamla" },
    level10: { icon: "🌟", title: "Seviye 10", desc: "10. seviyeyi tamamla" },
    level15: { icon: "✨", title: "Seviye 15", desc: "15. seviyeyi tamamla" },
    score1000: { icon: "💰", title: "Binlik", desc: "1000 puan topla" },
    score5000: { icon: "💎", title: "Beş Binlik", desc: "5000 puan topla" },
    score10000: { icon: "👑", title: "On Binlik", desc: "10000 puan topla" },
    powerUp10: { icon: "🎁", title: "Power Collector", desc: "10 power-up topla" },
    boss1: { icon: "👹", title: "Boss Slayer", desc: "1. boss'u yen" },
    boss2: { icon: "😈", title: "Boss Destroyer", desc: "2. boss'u yen" },
    boss3: { icon: "💀", title: "Boss Annihilator", desc: "3. boss'u yen" },
    perfectLevel: { icon: "💯", title: "Perfect", desc: "Can kaybetmeden seviye tamamla" },
  };
  
  const achievement = achievements[id];
  if (achievement) {
    showAchievement(achievement.icon, achievement.title, achievement.desc);
    saveAchievements();
  }
}

function showAchievement(icon, title, desc) {
  achievementIconEl.textContent = icon;
  achievementTitleEl.textContent = title;
  achievementDescEl.textContent = desc;
  achievementNotificationEl.classList.remove("hidden");
  
  setTimeout(() => {
    achievementNotificationEl.classList.add("hidden");
  }, 3000);
}

function saveAchievements() {
  try {
    localStorage.setItem('brickBreakerAchievements', JSON.stringify(game.achievements));
    localStorage.setItem('brickBreakerStats', JSON.stringify(game.stats));
  } catch (e) {
    // localStorage hatası
  }
}

function loadAchievements() {
  try {
    const saved = localStorage.getItem('brickBreakerAchievements');
    if (saved) {
      const loaded = JSON.parse(saved);
      Object.assign(game.achievements, loaded);
      game.achievementCount = Object.values(game.achievements).filter(v => v).length;
    }
    
    const savedStats = localStorage.getItem('brickBreakerStats');
    if (savedStats) {
      const loaded = JSON.parse(savedStats);
      Object.assign(game.stats, loaded);
    }
  } catch (e) {
    // localStorage hatası
  }
}

function updateStatsModal() {
  const playTimeSeconds = Math.floor((Date.now() - game.stats.startTime) / 1000) + game.stats.playTime;
  const minutes = Math.floor(playTimeSeconds / 60);
  const seconds = playTimeSeconds % 60;
  
  document.getElementById("totalScore").textContent = game.stats.totalScore;
  document.getElementById("bricksBroken").textContent = game.stats.bricksBroken;
  document.getElementById("maxCombo").textContent = game.stats.maxCombo;
  document.getElementById("powerUpsCollected").textContent = game.stats.powerUpsCollected;
  document.getElementById("levelsCompleted").textContent = game.stats.levelsCompleted;
  document.getElementById("playTime").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Achievements listesi
  const achievementsList = document.getElementById("achievementsList");
  achievementsList.innerHTML = "";
  
  const achievements = {
    firstBrick: { icon: "🎯", name: "İlk Tuğla" },
    combo5: { icon: "🔥", name: "Combo Master" },
    combo10: { icon: "⚡", name: "Combo Pro" },
    combo20: { icon: "💥", name: "Combo Legend" },
    level5: { icon: "⭐", name: "Seviye 5" },
    level10: { icon: "🌟", name: "Seviye 10" },
    level15: { icon: "✨", name: "Seviye 15" },
    score1000: { icon: "💰", name: "Binlik" },
    score5000: { icon: "💎", name: "Beş Binlik" },
    score10000: { icon: "👑", name: "On Binlik" },
    powerUp10: { icon: "🎁", name: "Power Collector" },
    boss1: { icon: "👹", name: "Boss Slayer" },
    boss2: { icon: "😈", name: "Boss Destroyer" },
    boss3: { icon: "💀", name: "Boss Annihilator" },
    perfectLevel: { icon: "💯", name: "Perfect" },
  };
  
  for (const [id, achievement] of Object.entries(achievements)) {
    const badge = document.createElement("div");
    badge.className = `achievement-badge ${game.achievements[id] ? 'unlocked' : 'locked'}`;
    badge.innerHTML = `
      <div class="achievement-badge-icon">${achievement.icon}</div>
      <div class="achievement-badge-name">${achievement.name}</div>
    `;
    achievementsList.appendChild(badge);
  }
}

function showOverlay(title, message, buttonText, isGameEnd) {
  overlayTitleEl.textContent = title;
  overlayMessageEl.textContent = message;
  restartButton.innerHTML = `<span class="btn-icon">${isGameEnd ? "🔄" : "▶"}</span> ${buttonText}`;
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

// ==================== HIGH SCORE ====================
function loadHighScore() {
  try {
    const saved = localStorage.getItem('brickBreakerHighScore');
    if (saved) {
      game.highScore = parseInt(saved, 10);
      highScoreEl.textContent = game.highScore;
    }
  } catch (e) {
    // localStorage hatası
  }
}

function saveHighScore() {
  try {
    localStorage.setItem('brickBreakerHighScore', game.highScore.toString());
  } catch (e) {
    // localStorage hatası
  }
}

// ==================== UTILITY FUNCTIONS ====================
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== START ====================
init();
