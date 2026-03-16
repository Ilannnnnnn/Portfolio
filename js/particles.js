/**
 * particles.js — Particules canvas pour le hero (thème light)
 * Particules sombres/colorées sur fond crème, mouvement brownien lent.
 */

const CONFIG = {
  count:          70,
  minRadius:      1,
  maxRadius:      2,
  minSpeed:       0.1,
  maxSpeed:       0.35,
  connectionDist: 110,
  /* Couleurs discrètes sur fond crème */
  colors:         ['#2d6a4f', '#1a1a1a', '#2b6cb0', '#744210'],
  minOpacity:     0.15,
  maxOpacity:     0.5,
};

const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrameId;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle() {
    const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    return {
      x:       rand(0, canvas.width),
      y:       rand(0, canvas.height),
      vx:      (rand(CONFIG.minSpeed, CONFIG.maxSpeed)) * (Math.random() < 0.5 ? 1 : -1),
      vy:      (rand(CONFIG.minSpeed, CONFIG.maxSpeed)) * (Math.random() < 0.5 ? 1 : -1),
      r:       rand(CONFIG.minRadius, CONFIG.maxRadius),
      color,
      opacity: rand(CONFIG.minOpacity, CONFIG.maxOpacity),
    };
  }

  function initParticles() {
    particles = Array.from({ length: CONFIG.count }, createParticle);
  }

  function updateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
    else if (p.x > canvas.width - p.r) { p.x = canvas.width - p.r; p.vx = -Math.abs(p.vx); }
    if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
    else if (p.y > canvas.height - p.r) { p.y = canvas.height - p.r; p.vy = -Math.abs(p.vy); }
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(p.color, p.opacity);
    ctx.fill();
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          const alpha = (1 - dist / CONFIG.connectionDist) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(a.color, alpha);
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) { updateParticle(p); drawParticle(p); }
    drawConnections();
    animFrameId = requestAnimationFrame(animate);
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animFrameId);
      resize(); initParticles(); animate();
    }, 150);
  });

  resize();
  initParticles();
  animate();
}
