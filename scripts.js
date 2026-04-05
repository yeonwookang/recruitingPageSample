/* ================================================================
   HANWHA SYSTEMS ICT — scripts.js
   Features:
     - WebGL-based 3D cube canvas (hero background)
     - Floating orange 3D cubes (decorative, zero-gravity)
     - Scroll reveal animations
     - Navbar scroll behaviour
     - Hamburger menu
     - Carousel (interview cards)
     - Modal (interview detail)
     - Countdown timer
     - Parallax text effects
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   UTILITY
   ---------------------------------------------------------------- */
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ================================================================
   1. NAVBAR — scroll & hamburger
   ================================================================ */
(function initNavbar() {
  const navbar = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks = qs('#navLinks');

  // Scroll → add .scrolled class
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  });

  // Close on link click (mobile)
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });
})();

/* ================================================================
   2. SCROLL REVEAL
   ================================================================ */
(function initScrollReveal() {
  const elements = qsa('.scroll-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay ? parseInt(entry.target.dataset.delay) : 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -60px 0px' });

  elements.forEach((el) => observer.observe(el));
})();

/* ================================================================
   3. HERO CANVAS — 3D rotating cubes (WebGL-lite via Canvas 2D)
   ================================================================ */
(function initHeroCanvas() {
  const canvas = qs('#cubeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const resize = () => {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // --- Cube wireframe geometry (unit cube vertices) ---
  const VERTS = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1], // back face
    [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1], // front face
  ];
  const EDGES = [
    [0,1],[1,2],[2,3],[3,0], // back
    [4,5],[5,6],[6,7],[7,4], // front
    [0,4],[1,5],[2,6],[3,7], // connectors
  ];

  // --- Project 3D → 2D (perspective) ---
  function project(v, fov, cx, cy) {
    const z = v[2] + fov;
    const scale = fov / (z || 1);
    return [v[0] * scale + cx, v[1] * scale + cy];
  }

  // --- Rotate helpers ---
  function rotX(v, a) {
    return [v[0], v[1]*Math.cos(a)-v[2]*Math.sin(a), v[1]*Math.sin(a)+v[2]*Math.cos(a)];
  }
  function rotY(v, a) {
    return [v[0]*Math.cos(a)+v[2]*Math.sin(a), v[1], -v[0]*Math.sin(a)+v[2]*Math.cos(a)];
  }
  function rotZ(v, a) {
    return [v[0]*Math.cos(a)-v[1]*Math.sin(a), v[0]*Math.sin(a)+v[1]*Math.cos(a), v[2]];
  }

  // --- Generate floating cubes ---
  const NUM_CUBES = 14;
  const cubes = Array.from({ length: NUM_CUBES }, (_, i) => ({
    x: Math.random() * 1.8 - 0.9,  // normalised -0.9..0.9
    y: Math.random() * 1.8 - 0.9,
    z: Math.random() * 3 + 1.5,
    size: 40 + Math.random() * 80,
    ax: Math.random() * 0.006 + 0.002,
    ay: Math.random() * 0.007 + 0.002,
    az: Math.random() * 0.004,
    rx: Math.random() * Math.PI * 2,
    ry: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    vy: (Math.random() - 0.5) * 0.0005,  // zero-gravity float
    vx: (Math.random() - 0.5) * 0.0003,
    alpha: 0.08 + Math.random() * 0.18,
    colorH: Math.random() > 0.5 ? 24 : 200, // orange or blue-purple
  }));

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  }, { passive: true });

  function drawCube(cube, t) {
    cube.rx += cube.ax;
    cube.ry += cube.ay + mouseX * 0.002;
    cube.rz += cube.az;

    // Zero-gravity drift
    cube.x += cube.vx;
    cube.y += cube.vy;
    if (cube.x > 1.1 || cube.x < -1.1) cube.vx *= -1;
    if (cube.y > 1.1 || cube.y < -1.1) cube.vy *= -1;

    const cx = (cube.x * 0.5 + 0.5) * W;
    const cy = (cube.y * 0.5 + 0.5) * H;
    const fov = 300;

    // Transform vertices
    const transformed = VERTS.map((v) => {
      let p = [v[0]*cube.size, v[1]*cube.size, v[2]*cube.size];
      p = rotX(p, cube.rx);
      p = rotY(p, cube.ry);
      p = rotZ(p, cube.rz);
      return p;
    });

    const projected = transformed.map((v) => project(v, fov, cx, cy));

    // Draw edges
    const isOrange = cube.colorH === 24;
    ctx.strokeStyle = isOrange
      ? `rgba(255, 107, 0, ${cube.alpha})`
      : `rgba(100, 140, 255, ${cube.alpha * 0.6})`;
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = isOrange ? 12 : 6;
    ctx.shadowColor = isOrange ? 'rgba(255,107,0,0.4)' : 'rgba(80,120,255,0.3)';

    EDGES.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(projected[a][0], projected[a][1]);
      ctx.lineTo(projected[b][0], projected[b][1]);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  }

  let raf;
  function animate(t) {
    ctx.clearRect(0, 0, W, H);
    cubes.forEach((cube) => drawCube(cube, t));
    raf = requestAnimationFrame(animate);
  }

  // Only animate when hero is visible (performance)
  const heroObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!raf) raf = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }, { threshold: 0 });
  heroObs.observe(qs('#hero'));
})();

/* ================================================================
   4. FLOATING CUBES — decorative div-based cubes injected into sections
   ================================================================ */
(function initFloatingCubes() {
  const containers = qsa('.floating-cubes-bg');
  if (!containers.length) return;

  const COUNT = 6;

  containers.forEach((container) => {
    for (let i = 0; i < COUNT; i++) {
      const cube = document.createElement('div');
      const size = 20 + Math.random() * 50;
      const left = Math.random() * 90;
      const top = Math.random() * 90;
      const dur = 8 + Math.random() * 12;
      const delay = Math.random() * 6;
      const rotate = Math.random() * 360;

      cube.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: ${top}%;
        width: ${size}px;
        height: ${size}px;
        border: 1.5px solid rgba(255,107,0,${0.08 + Math.random() * 0.15});
        transform: rotate(${rotate}deg);
        animation: floatCubeDrift ${dur}s ${delay}s ease-in-out infinite alternate;
        pointer-events: none;
        border-radius: 3px;
        box-shadow: 0 0 ${size * 0.4}px rgba(255,107,0,0.1);
      `;
      container.appendChild(cube);
    }
  });

  // Inject keyframe
  if (!qs('#floatCubeStyle')) {
    const style = document.createElement('style');
    style.id = 'floatCubeStyle';
    style.textContent = `
      @keyframes floatCubeDrift {
        0%   { transform: translateY(0px) rotate(var(--r, 0deg)) scale(1); opacity: 0.5; }
        50%  { transform: translateY(-40px) rotate(calc(var(--r, 0deg) + 45deg)) scale(1.08); opacity: 0.8; }
        100% { transform: translateY(20px) rotate(calc(var(--r, 0deg) + 90deg)) scale(0.94); opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }
})();

/* ================================================================
   5. PARALLAX TEXT EFFECTS (subtle tilt on section titles)
   ================================================================ */
(function initParallaxText() {
  const titles = qsa('.section-title');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    titles.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const fromCenter = (window.innerHeight / 2 - center) / window.innerHeight;
      el.style.transform = `translateY(${fromCenter * 18}px)`;
    });
  }, { passive: true });
})();

/* ================================================================
   6. HERO TITLE — mouse tilt 3D effect
   ================================================================ */
(function initHeroTilt() {
  const title = qs('.threeDTitle');
  if (!title) return;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;   // -1 .. 1
    const dy = (e.clientY - cy) / cy;

    title.style.transform = `
      perspective(800px)
      rotateX(${-dy * 10}deg)
      rotateY(${dx * 10}deg)
      translateY(${Math.sin(Date.now() * 0.002) * 6}px)
    `;
  }, { passive: true });
})();

/* ================================================================
   7. SCROLL-TRIGGERED ANIMATED NUMBER COUNTERS (bonus, etc.)
      Generic: add data-count="1234" to any element
   ================================================================ */
(function initCounters() {
  const counters = qsa('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const dur = 1800;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => obs.observe(el));
})();

/* ================================================================
   8. CAROUSEL — interview cards
   ================================================================ */
(function initCarousel() {
  const track = qs('#carouselTrack');
  const prevBtn = qs('#prevBtn');
  const nextBtn = qs('#nextBtn');
  const dotsContainer = qs('#carouselDots');
  if (!track) return;

  const cards = qsa('.interview-card', track);
  let current = 0;
  let autoTimer;

  // Build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });
  const dots = qsa('span', dotsContainer);

  function getCardWidth() {
    const card = cards[0];
    const style = getComputedStyle(card);
    return card.offsetWidth + parseInt(style.marginRight || 0) +
           parseInt(getComputedStyle(track).gap || 24);
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, cards.length - 1));
    const offset = -current * getCardWidth();
    // On wide screens show 3 cards, clamp offset
    const maxVisible = Math.floor(track.parentElement.offsetWidth / getCardWidth());
    const clampedOffset = Math.max(
      -((cards.length - maxVisible) * getCardWidth()),
      Math.min(0, offset)
    );
    track.style.transform = `translateX(${clampedOffset}px)`;

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  // Touch/swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? goTo(current + 1) : goTo(current - 1);
      resetAuto();
    }
  }, { passive: true });

  // Auto-advance
  function startAuto() {
    autoTimer = setInterval(() => {
      goTo(current >= cards.length - 1 ? 0 : current + 1);
    }, 4500);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  startAuto();
  window.addEventListener('resize', () => goTo(current), { passive: true });
})();

/* ================================================================
   9. INTERVIEW MODAL
   ================================================================ */
(function initModal() {
  const overlay = qs('#modalOverlay');
  const closeBtn = qs('#modalClose');
  if (!overlay) return;

  const DATA = [
    {
      avatar: '👨‍💻',
      dept: 'DX담당 / AI플랫폼팀',
      name: '김○○ 선임',
      content: `저는 한화시스템 ICT부문에서 AI 플랫폼 개발을 담당하고 있습니다. LLM 기반의 서비스를 실제 기업 현장에 적용하는 순간이 가장 보람됩니다. 이곳에서 직접 AX 트렌드를 이끌어가는 경험은 다른 곳에서는 할 수 없는 것 같습니다. 함께하는 구성원들의 전문성과 열정이 저를 성장시켜 줍니다.`
    },
    {
      avatar: '👩‍💻',
      dept: 'DX담당 / 데이터분석팀',
      name: '이○○ 책임',
      content: `데이터를 통해 고객사의 의사결정 방식이 바뀌는 것을 지켜보는 게 제 일의 원동력입니다. 한화시스템 ICT부문은 학습 지원이 탄탄해서 석사 과정도 병행할 수 있었습니다. 성과에 대한 보상도 투명하고 합리적이라 일에 더 집중할 수 있는 환경입니다.`
    },
    {
      avatar: '🧑‍💼',
      dept: 'DX담당 / 클라우드인프라팀',
      name: '박○○ 선임',
      content: `클라우드와 AI의 결합이 만들어내는 가능성은 무한합니다. 저는 여기서 그 인프라를 직접 설계하고 운영합니다. MSA, DevSecOps 등 최신 기술을 실무에 바로 적용할 수 있어 기술적으로 빠르게 성장했습니다. 자격수당도 꼼꼼히 챙겨줘서 자격증 공부에도 열정이 생깁니다.`
    },
    {
      avatar: '👩‍🔬',
      dept: 'DX담당 / UX혁신팀',
      name: '최○○ 선임',
      content: `AI가 단순한 기능을 넘어 사람에게 진정으로 유용한 경험을 주려면 디자인이 핵심입니다. 저는 그 교차점에서 일하고 있습니다. 심리상담 복리후생도 있고, 일-가정 균형을 위한 제도들도 실질적으로 사용 가능합니다. 그래서 긴 프로젝트도 지치지 않고 집중할 수 있습니다.`
    },
    {
      avatar: '🧑‍🚀',
      dept: 'DX담당 / AX컨설팅팀',
      name: '정○○ 수석',
      content: `20년 넘게 IT컨설팅을 해왔지만, 지금이 가장 흥미롭습니다. AI가 비즈니스를 바꾸는 속도가 경이롭고, 한화시스템 ICT부문은 그 선두에 있습니다. Global Talent Program으로 해외 연수도 다녀왔고, 후배들이 최고의 전문가로 성장하는 모습을 보는 것이 또 다른 보람입니다.`
    },
  ];

  function openModal(idx) {
    const d = DATA[idx];
    if (!d) return;
    qs('#modalAvatar').textContent = d.avatar;
    qs('#modalDept').textContent = d.dept;
    qs('#modalTitle').textContent = d.name;
    qs('#modalContent').textContent = d.content;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Delegate click on .btn-detail and .interview-card
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-detail');
    if (btn) { openModal(parseInt(btn.dataset.idx, 10)); return; }
    const card = e.target.closest('.interview-card');
    if (card) { openModal(parseInt(card.dataset.index, 10)); return; }
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

/* ================================================================
   10. COUNTDOWN TIMER (target: 2026-05-24 23:59:59 KST)
   ================================================================ */
(function initCountdown() {
  const target = new Date('2026-05-24T23:59:59+09:00').getTime();

  const cdDays = qs('#cdDays');
  const cdHours = qs('#cdHours');
  const cdMins = qs('#cdMins');
  const cdSecs = qs('#cdSecs');
  if (!cdDays) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      cdDays.textContent = cdHours.textContent = cdMins.textContent = cdSecs.textContent = '00';
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    cdDays.textContent  = pad(days);
    cdHours.textContent = pad(hours);
    cdMins.textContent  = pad(mins);
    cdSecs.textContent  = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ================================================================
   11. SECTION BG PARALLAX (subtle Y-shift on scroll)
   ================================================================ */
(function initSectionParallax() {
  const sections = qsa('.section-dark');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const factor = (rect.top / window.innerHeight) * 0.05;
      sec.style.backgroundPositionY = `${factor * 100}%`;
    });
  }, { passive: true });
})();

/* ================================================================
   12. GLITCH EFFECT — hero slogan
   ================================================================ */
(function initGlitch() {
  const el = qs('.glitch-text');
  if (!el) return;

  const style = document.createElement('style');
  style.textContent = `
    .glitch-text {
      position: relative;
    }
    .glitch-text::before,
    .glitch-text::after {
      content: attr(data-text);
      position: absolute;
      left: 0; top: 0;
      width: 100%; height: 100%;
    }
    .glitch-text::before {
      color: #0ff;
      clip: rect(0, 9999px, 0, 0);
      animation: glitchTop 3.5s infinite linear alternate-reverse;
    }
    .glitch-text::after {
      color: #f0f;
      clip: rect(0, 9999px, 0, 0);
      animation: glitchBot 3s infinite linear alternate-reverse;
    }
    @keyframes glitchTop {
      0%   { clip: rect(2px, 9999px, 6px, 0);  transform: skewX(0.4deg); opacity:0; }
      5%   { clip: rect(10px, 9999px, 18px, 0); transform: skewX(-0.4deg); opacity:0.8; }
      10%  { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
      90%  { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
      95%  { clip: rect(4px, 9999px, 10px, 0);  transform: skewX(0.3deg); opacity:0.6; }
      100% { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
    }
    @keyframes glitchBot {
      0%   { clip: rect(16px, 9999px, 20px, 0); transform: skewX(-0.2deg); opacity:0; }
      8%   { clip: rect(20px, 9999px, 30px, 0); transform: skewX(0.5deg);  opacity:0.7; }
      12%  { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
      88%  { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
      96%  { clip: rect(12px, 9999px, 22px, 0); transform: skewX(-0.3deg); opacity:0.5; }
      100% { clip: rect(0, 9999px, 0, 0);       opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ================================================================
   13. MOBILE TABLE — inject data-label attributes
   ================================================================ */
(function injectTableLabels() {
  const table = qs('.jobs-table');
  if (!table) return;

  const headers = qsa('th', table);
  const rows = qsa('tbody tr', table);

  rows.forEach((row) => {
    qsa('td', row).forEach((td, i) => {
      if (headers[i]) td.setAttribute('data-label', headers[i].textContent);
    });
  });
})();

/* ================================================================
   14. SMOOTH ACTIVE NAV LINK highlight on scroll
   ================================================================ */
(function initActiveNav() {
  const sections = qsa('section[id]');
  const navAs = qsa('.nav-links a[href^="#"]');
  if (!sections.length || !navAs.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAs.forEach((a) => a.classList.remove('active-nav'));
        const active = navAs.find((a) => a.getAttribute('href') === `#${entry.target.id}`);
        if (active) active.classList.add('active-nav');
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach((s) => obs.observe(s));

  // Add style for active-nav
  const st = document.createElement('style');
  st.textContent = `.active-nav { color: var(--orange) !important; }
  .active-nav::after { width: 100% !important; }`;
  document.head.appendChild(st);
})();
