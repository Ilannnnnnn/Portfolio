/**
 * particles.js — Système de particules canvas pour le hero
 * ~80 particules avec mouvement brownien, rebond sur les bords
 * et connexions par lignes fines entre particules proches.
 * Zéro dépendance externe — requestAnimationFrame.
 */

/* -------------------------------------------------------
   Configuration
------------------------------------------------------- */
const CONFIG = {
  count:           80,      // Nombre de particules
  minRadius:       1,       // Rayon minimum (px)
  maxRadius:       2.5,     // Rayon maximum (px)
  minSpeed:        0.15,    // Vitesse min
  maxSpeed:        0.5,     // Vitesse max
  connectionDist:  120,     // Distance max pour tracer une ligne (px)
  colors:          ['#6c63ff', '#00d4ff'], // Couleurs des particules
  minOpacity:      0.2,
  maxOpacity:      0.8,
};

/* -------------------------------------------------------
   Initialisation
------------------------------------------------------- */
const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx   = canvas.getContext('2d');
  let particles = [];
  let animFrameId;

  /** Redimensionne le canvas à la taille du hero */
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  /** Génère un nombre aléatoire entre min et max */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /** Crée une particule avec des propriétés aléatoires */
  function createParticle() {
    const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    return {
      x:       rand(0, canvas.width),
      y:       rand(0, canvas.height),
      vx:      rand(-CONFIG.maxSpeed, CONFIG.maxSpeed) || CONFIG.minSpeed,
      vy:      rand(-CONFIG.maxSpeed, CONFIG.maxSpeed) || CONFIG.minSpeed,
      r:       rand(CONFIG.minRadius, CONFIG.maxRadius),
      color,
      opacity: rand(CONFIG.minOpacity, CONFIG.maxOpacity),
    };
  }

  /** Initialise toutes les particules */
  function initParticles() {
    particles = Array.from({ length: CONFIG.count }, createParticle);
  }

  /** Met à jour la position d'une particule (rebond sur les bords) */
  function updateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;

    /* Rebond horizontal */
    if (p.x < p.r) {
      p.x  = p.r;
      p.vx = Math.abs(p.vx);
    } else if (p.x > canvas.width - p.r) {
      p.x  = canvas.width - p.r;
      p.vx = -Math.abs(p.vx);
    }

    /* Rebond vertical */
    if (p.y < p.r) {
      p.y  = p.r;
      p.vy = Math.abs(p.vy);
    } else if (p.y > canvas.height - p.r) {
      p.y  = canvas.height - p.r;
      p.vy = -Math.abs(p.vy);
    }
  }

  /** Dessine une particule */
  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(p.color, p.opacity);
    ctx.fill();
  }

  /**
   * Dessine les lignes de connexion entre particules proches.
   * L'opacité de la ligne est proportionnelle à la proximité.
   */
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDist) {
          const alpha = (1 - dist / CONFIG.connectionDist) * 0.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          /* Gradient entre les deux couleurs des particules */
          const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, hexToRgba(a.color, alpha));
          gradient.addColorStop(1, hexToRgba(b.color, alpha));
          ctx.strokeStyle = gradient;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  /** Boucle d'animation principale */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Mise à jour + dessin des particules */
    for (const p of particles) {
      updateParticle(p);
      drawParticle(p);
    }

    /* Connexions entre particules proches */
    drawConnections();

    animFrameId = requestAnimationFrame(animate);
  }

  /**
   * Convertit une couleur hex (#rrggbb) + alpha en rgba(r,g,b,a).
   * @param {string} hex   - Couleur hexadécimale (#6c63ff)
   * @param {number} alpha - Opacité entre 0 et 1
   * @returns {string}
   */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* -------------------------------------------------------
     Gestion du redimensionnement
  ------------------------------------------------------- */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    /* Debounce pour éviter trop d'appels lors du resize */
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animFrameId);
      resize();
      initParticles();
      animate();
    }, 150);
  });

  /* -------------------------------------------------------
     Démarrage
  ------------------------------------------------------- */
  resize();
  initParticles();
  animate();
}
