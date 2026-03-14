const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const targetEl = document.getElementById('target');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');

const BONKABLES = [
  { label: 'Lemur', icon: '🦝', points: 14 },
  { label: 'Sugar Glider', icon: '🐿️', points: 13 },
  { label: 'Tinned Fish', icon: '🐟', points: 11 },
  { label: 'Polar Bear', icon: '🐻‍❄️', points: 16 },
  { label: 'Panda', icon: '🐼', points: 15 },
  { label: 'Snoopy', icon: '🐶', points: 12 },
  { label: 'Hot Dog', icon: '🌭', points: 10 },
  { label: 'Almond Croissant', icon: '🥐', points: 13 },
  { label: 'Espresso', icon: '☕', points: 9 },
  { label: 'Gelato', icon: '🍨', points: 11 },
  { label: 'Suitcase', icon: '🧳', points: 12 },
  { label: 'Hiking Shoes', icon: '🥾', points: 10 },
  { label: 'Australian Shepherd', icon: '🐕', points: 14 },
  { label: 'Tuxedo Cat', icon: '🐈‍⬛', points: 14 },
  { label: 'Crocs', icon: '👟', points: 9 },
];

const gameState = {
  running: false,
  score: 0,
  timeLeft: 60,
  targetScore: 160,
  keys: {},
  targets: [],
  spawnTimer: 0,
  popups: [],
  bonkFx: 0,
  kiwi: {
    x: canvas.width * 0.22,
    y: canvas.height - 115,
    w: 74,
    h: 58,
    speed: 370,
    facing: 1,
    beakExtend: 0,
    cooldown: 0,
  },
  buddy: {
    x: canvas.width * 0.72,
    y: canvas.height - 110,
    bob: 0,
  },
};

targetEl.textContent = String(gameState.targetScore);

function updateHUD() {
  scoreEl.textContent = String(gameState.score);
  timerEl.textContent = String(Math.ceil(gameState.timeLeft));
}

function resetGame() {
  gameState.running = true;
  gameState.score = 0;
  gameState.timeLeft = 60;
  gameState.targets = [];
  gameState.popups = [];
  gameState.spawnTimer = 0;
  gameState.bonkFx = 0;
  gameState.kiwi.x = canvas.width * 0.22;
  gameState.kiwi.facing = 1;
  gameState.kiwi.beakExtend = 0;
  gameState.kiwi.cooldown = 0;
  overlay.classList.add('hidden');
  updateHUD();
}

function endGame(victory) {
  gameState.running = false;
  overlay.classList.remove('hidden');

  if (victory) {
    overlayTitle.textContent = 'Beak Bonk Victory!';
    overlayText.textContent = `You scored ${gameState.score} points. The kiwi beak legend grows. Press R or Start Round to play again.`;
    startBtn.textContent = 'Play Again';
  } else {
    overlayTitle.textContent = 'Round Over';
    overlayText.textContent = `You reached ${gameState.score} points. Target is ${gameState.targetScore}. Try again and bonk harder!`;
    startBtn.textContent = 'Retry';
  }
}

function spawnTarget() {
  const pick = BONKABLES[(Math.random() * BONKABLES.length) | 0];
  const size = 32 + Math.random() * 10;

  gameState.targets.push({
    ...pick,
    x: 80 + Math.random() * (canvas.width - 160),
    y: -40,
    vx: (Math.random() - 0.5) * 80,
    vy: 115 + Math.random() * 140,
    size,
    wobble: Math.random() * Math.PI * 2,
  });
}

function performBonk() {
  if (!gameState.running) return;
  if (gameState.kiwi.cooldown > 0) return;

  gameState.kiwi.beakExtend = 1;
  gameState.kiwi.cooldown = 0.2;
  gameState.bonkFx = 1;

  const tipX = gameState.kiwi.facing > 0
    ? gameState.kiwi.x + gameState.kiwi.w + 52
    : gameState.kiwi.x - 52;
  const tipY = gameState.kiwi.y + 22;
  const bonkRadius = 84;

  let chain = 0;
  gameState.targets = gameState.targets.filter((target) => {
    const tx = target.x + target.size * 0.5;
    const ty = target.y + target.size * 0.5;
    const d = Math.hypot(tx - tipX, ty - tipY);
    if (d <= bonkRadius) {
      chain += 1;
      gameState.score += target.points;
      gameState.popups.push({ text: `+${target.points}`, x: tx, y: ty, life: 0.6 });
      return false;
    }
    return true;
  });

  if (chain === 0) {
    gameState.popups.push({ text: 'WHIFF', x: tipX, y: tipY, life: 0.4, miss: true });
  }

  if (gameState.score >= gameState.targetScore) {
    endGame(true);
  }

  updateHUD();
}

function update(dt) {
  if (!gameState.running) return;

  gameState.timeLeft -= dt;
  gameState.kiwi.cooldown = Math.max(0, gameState.kiwi.cooldown - dt);
  gameState.kiwi.beakExtend = Math.max(0, gameState.kiwi.beakExtend - dt * 6);
  gameState.buddy.bob += dt * 4;
  gameState.bonkFx = Math.max(0, gameState.bonkFx - dt * 4);

  let moveX = 0;
  if (gameState.keys.ArrowLeft || gameState.keys.a || gameState.keys.A) moveX -= 1;
  if (gameState.keys.ArrowRight || gameState.keys.d || gameState.keys.D) moveX += 1;

  if (moveX !== 0) gameState.kiwi.facing = moveX > 0 ? 1 : -1;
  gameState.kiwi.x += moveX * gameState.kiwi.speed * dt;
  gameState.kiwi.x = Math.max(20, Math.min(canvas.width - gameState.kiwi.w - 20, gameState.kiwi.x));

  gameState.spawnTimer -= dt;
  if (gameState.spawnTimer <= 0) {
    spawnTarget();
    gameState.spawnTimer = Math.max(0.28, 0.64 - gameState.score / 560);
  }

  for (const target of gameState.targets) {
    target.wobble += dt * 3;
    target.x += target.vx * dt + Math.sin(target.wobble) * 20 * dt;
    target.y += target.vy * dt;

    if (target.x < 20 || target.x > canvas.width - 20 - target.size) {
      target.vx *= -1;
    }
  }

  gameState.targets = gameState.targets.filter((target) => target.y < canvas.height + 50);

  for (const popup of gameState.popups) {
    popup.y -= 50 * dt;
    popup.life -= dt;
  }
  gameState.popups = gameState.popups.filter((popup) => popup.life > 0);

  if (gameState.timeLeft <= 0) {
    endGame(gameState.score >= gameState.targetScore);
  }

  updateHUD();
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#2f5a6d');
  grad.addColorStop(0.52, '#1c3947');
  grad.addColorStop(1, '#0f1822');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 65; i++) {
    const x = (i * 127) % canvas.width;
    const y = (i * 41) % (canvas.height * 0.55);
    ctx.fillStyle = `rgba(210, 255, 238, ${0.07 + ((i % 9) / 50)})`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = '#17303f';
  ctx.fillRect(0, canvas.height - 110, canvas.width, 110);
}

function drawKiwi(x, y, facing, beakExtend, main = true) {
  ctx.save();
  if (facing < 0) {
    ctx.translate(x + 74, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  ctx.fillStyle = main ? '#7c5a38' : '#6a4e34';
  ctx.beginPath();
  ctx.ellipse(x + 34, y + 30, 34, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3b2d20';
  ctx.fillRect(x + 8, y + 28, 8, 6);
  ctx.fillRect(x + 23, y + 49, 4, 11);
  ctx.fillRect(x + 35, y + 49, 4, 11);

  const beakLen = 38 + beakExtend * 24;
  ctx.fillStyle = '#e4c38c';
  ctx.fillRect(x + 56, y + 28, beakLen, 4);

  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 50, y + 20, 8, 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 53, y + 23, 3, 3);

  ctx.restore();
}

function drawTargets() {
  ctx.font = '26px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';

  for (const target of gameState.targets) {
    ctx.fillStyle = 'rgba(4, 10, 18, 0.45)';
    ctx.fillRect(target.x - 8, target.y - 8, target.size + 16, target.size + 16);

    ctx.fillText(target.icon, target.x + target.size / 2, target.y + target.size * 0.78);
  }
}

function drawPopups() {
  ctx.textAlign = 'center';
  for (const popup of gameState.popups) {
    ctx.globalAlpha = Math.max(0, popup.life / 0.6);
    ctx.fillStyle = popup.miss ? '#ff8c8c' : '#b3ff8e';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.globalAlpha = 1;
  }
}

function drawBonkPulse() {
  if (gameState.bonkFx <= 0) return;

  const alpha = gameState.bonkFx * 0.24;
  ctx.fillStyle = `rgba(255, 232, 133, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTargetPreview() {
  ctx.fillStyle = 'rgba(8, 15, 25, 0.72)';
  ctx.fillRect(14, 14, 420, 72);
  ctx.strokeStyle = 'rgba(146, 255, 127, 0.45)';
  ctx.strokeRect(14, 14, 420, 72);
  ctx.fillStyle = '#d9ffe8';
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Bonk targets: lemur, sugar glider, fish tin, polar bear, panda, snoopy, hot dog...', 22, 40);
  ctx.fillText('...croissant, espresso, gelato, suitcase, hiking shoes, aussie shepherd, tux cat, crocs', 22, 62);
}

function draw() {
  drawBackground();
  drawTargets();
  drawKiwi(gameState.buddy.x, gameState.buddy.y + Math.sin(gameState.buddy.bob) * 4, -1, 0.2, false);
  drawKiwi(gameState.kiwi.x, gameState.kiwi.y, gameState.kiwi.facing, gameState.kiwi.beakExtend, true);
  drawPopups();
  drawBonkPulse();
  drawTargetPreview();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  gameState.keys[event.key] = true;

  if (event.key === ' ') {
    event.preventDefault();
    if (!gameState.running) {
      resetGame();
    } else {
      performBonk();
    }
  }

  if (event.key.toLowerCase() === 'r') {
    resetGame();
  }
});

window.addEventListener('keyup', (event) => {
  gameState.keys[event.key] = false;
});

startBtn.addEventListener('click', resetGame);
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) resetGame();
});

updateHUD();
requestAnimationFrame(loop);
