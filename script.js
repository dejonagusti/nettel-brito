/* ============================================================
   NETTEL & BRITO DE MARTÍ — interacciones
   ============================================================
   Cada bloque de funcionalidad corre dentro de safeRun(), que
   aísla errores: si un bloque falla, se registra en consola pero
   NO detiene la ejecución de los bloques siguientes (a diferencia
   de antes, donde un error interrumpía todo el script).
   ============================================================ */

function safeRun(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[Nettel & Brito] Fallo en "${label}":`, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- LOADER ---------- */
  safeRun('loader', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('is-hidden'), 500);
    });
    // Red de seguridad: si 'load' tarda o no llega a disparar, el loader
    // se oculta igualmente para que la página nunca quede bloqueada.
    setTimeout(() => loader.classList.add('is-hidden'), 2200);
  });

  /* ---------- CURSOR PERSONALIZADO ---------- */
  safeRun('cursor', () => {
    const dot = document.getElementById('cursorDot');
    const glow = document.getElementById('cursorGlow');
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch || !dot || !glow) return;

    let mx = 0, my = 0, gx = 0, gy = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    (function animateGlow(){
      gx += (mx - gx) * 0.12;
      gy += (my - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateGlow);
    })();

    document.querySelectorAll('a, button, .story-card, .union-card, .img-drop').forEach(el => {
      el.addEventListener('mouseenter', () => { dot.style.transform += ' scale(2.4)'; glow.style.opacity = '1'; });
      el.addEventListener('mouseleave', () => { glow.style.opacity = '.7'; });
    });
  });

  /* ---------- BARRA DE PROGRESO DE SCROLL + BOTÓN VOLVER ARRIBA ----------
     Corregido: backToTop se declara ANTES de invocar onScroll(), ya que
     onScroll() lo usa. Antes se declaraba más abajo, lo que provocaba un
     ReferenceError (temporal dead zone) y detenía todo el script. */
  safeRun('scroll-progress', () => {
    const progressBar = document.getElementById('scrollProgress');
    const nav = document.getElementById('nav');
    const backToTop = document.getElementById('backToTop');

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + '%';
      if (nav) nav.classList.toggle('is-scrolled', scrollTop > 40);
      if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });

  /* ---------- RIPPLE EN BOTONES ---------- */
  safeRun('ripple', () => {
    document.querySelectorAll('.ripple').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const circle = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        circle.className = 'ripple-effect';
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
        circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(circle);
        setTimeout(() => circle.remove(), 700);
      });
    });
  });

  /* ---------- INTERSECTION OBSERVER: SCROLL REVEAL ----------
     Si el navegador no soporta IntersectionObserver, se muestran
     todos los elementos de inmediato en lugar de dejarlos ocultos. */
  safeRun('scroll-reveal', () => {
    const revealTargets = document.querySelectorAll(
      '.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-fade'
    );

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(el => el.classList.add('in-view'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  });

  /* ---------- RED DE SEGURIDAD GLOBAL ----------
     Por si algún elemento reveal-* nunca cruza el umbral del observer
     (por ejemplo, en pantallas muy altas o layouts atípicos), se fuerza
     su visibilidad pasado un tiempo prudencial. Esto es un respaldo
     además del fallback en CSS puro (@keyframes forceVisible). */
  safeRun('reveal-safety-net', () => {
    setTimeout(() => {
      document.querySelectorAll(
        '.reveal-fade-up:not(.in-view), .reveal-fade-left:not(.in-view), .reveal-fade-right:not(.in-view), .reveal-fade:not(.in-view)'
      ).forEach(el => el.classList.add('in-view'));
    }, 2500);
  });

  /* ---------- UNION WEB: activar líneas cuando entra en viewport ---------- */
  safeRun('union-web', () => {
    const unionWeb = document.getElementById('unionWeb');
    if (!unionWeb) return;

    if (!('IntersectionObserver' in window)) {
      unionWeb.classList.add('is-active');
      return;
    }
    const unionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          unionWeb.classList.add('is-active');
          unionObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    unionObserver.observe(unionWeb);
  });

  /* ---------- TIMELINE: activar iconos al entrar ---------- */
  safeRun('timeline', () => {
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (!timelineItems.length) return;

    if (!('IntersectionObserver' in window)) {
      timelineItems.forEach(el => el.classList.add('is-active'));
      return;
    }
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-active');
      });
    }, { threshold: 0.4 });
    timelineItems.forEach(el => timelineObserver.observe(el));
  });

  /* ---------- CONCLUSION ICON ---------- */
  safeRun('conclusion-icon', () => {
    const conclusionIcon = document.querySelector('.conclusion-icon');
    if (!conclusionIcon) return;

    if (!('IntersectionObserver' in window)) {
      conclusionIcon.classList.add('in-view');
      return;
    }
    const cObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.5 });
    cObserver.observe(conclusionIcon);
  });

  /* ---------- TILT SUAVE EN TARJETAS DE CUENTOS ---------- */
  safeRun('tilt', () => {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  });

  /* ---------- PARALLAX SUAVE DE ORBES CON EL MOUSE Y EL SCROLL ---------- */
  safeRun('parallax-orbs', () => {
    const orbs = document.querySelectorAll('.orb');
    if (!orbs.length) return;

    window.addEventListener('mousemove', (e) => {
      const px = (e.clientX / window.innerWidth) - 0.5;
      const py = (e.clientY / window.innerHeight) - 0.5;
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 10;
        orb.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
      });
    });

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      orbs.forEach((orb, i) => {
        orb.style.marginTop = `${y * (0.04 * (i + 1))}px`;
      });
    }, { passive: true });
  });

  /* ---------- DRAG & DROP DE IMÁGENES PNG ---------- */
  safeRun('drag-drop', () => {
    document.querySelectorAll('[data-drop]').forEach(dropZone => {
      const preview = dropZone.querySelector('.img-drop-preview');
      if (!preview) return;

      ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropZone.classList.add('is-dragover');
        });
      });
      ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropZone.classList.remove('is-dragover');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          preview.src = url;
          dropZone.classList.add('has-image');
        }
      });
      // También permitir click para seleccionar archivo
      dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg';
        input.onchange = () => {
          const file = input.files[0];
          if (file) {
            preview.src = URL.createObjectURL(file);
            dropZone.classList.add('has-image');
          }
        };
        input.click();
      });
    });
  });

  /* ---------- PARTÍCULAS SUTILES EN CANVAS ---------- */
  safeRun('particles', () => {
    const canvas = document.getElementById('particles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = [];
    let w, h;

    function resizeCanvas() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = document.documentElement.scrollHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const PARTICLE_COUNT = Math.min(60, Math.floor(window.innerWidth / 22));
    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.5,
          speedY: Math.random() * 0.15 + 0.03,
          speedX: (Math.random() - 0.5) * 0.08,
          opacity: Math.random() * 0.25 + 0.05
        });
      }
    }
    initParticles();
    window.addEventListener('resize', initParticles);

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(177,91,58,${p.opacity})`;
        ctx.fill();
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      });
      requestAnimationFrame(drawParticles);
    }
    requestAnimationFrame(drawParticles);
  });

  /* ---------- NAV: scroll suave a anclas ---------- */
  safeRun('nav-anchors', () => {
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });

});
