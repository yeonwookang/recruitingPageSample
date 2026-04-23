// ================= 혜택 캐러셀 도트 + 드래그 + 관성 스냅 =================
(function initBenefitsCarousel() {
  var _raf = null;

  // easeOutExpo: 빠르게 나가다 부드럽게 정착
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function smoothScrollTo(el, targetX, duration) {
    if (_raf) cancelAnimationFrame(_raf);
    var startX = el.scrollLeft;
    var dist   = targetX - startX;
    if (Math.abs(dist) < 1) return;
    var start  = null;
    function step(ts) {
      if (!start) start = ts;
      var frac = Math.min((ts - start) / duration, 1);
      el.scrollLeft = startX + dist * easeOutExpo(frac);
      if (frac < 1) { _raf = requestAnimationFrame(step); }
      else { el.scrollLeft = targetX; _raf = null; }
    }
    _raf = requestAnimationFrame(step);
  }

  function setup() {
    if (window.innerWidth > 1024) return;
    var grid = document.querySelector('.benefits-grid-page');
    var dotsWrap = document.querySelector('.benefits-dots');
    if (!grid || !dotsWrap) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.benefit-card-page'));
    if (!cards.length) return;

    // 패딩 오프셋 (첫 카드 앞 여백)
    var PAD = 20;

    function targetLeft(i) {
      return Math.max(0, cards[i].offsetLeft - PAD);
    }

    // 도트 생성
    dotsWrap.innerHTML = '';
    var dots = [];
    cards.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'b-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', function () {
        smoothScrollTo(grid, targetLeft(i), 480);
      });
      dotsWrap.appendChild(d);
      dots.push(d);
    });

    // 가장 가까운 카드 인덱스
    function closestIdx() {
      var center = grid.scrollLeft + grid.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var dist = Math.abs((c.offsetLeft + c.offsetWidth / 2) - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function updateDots() {
      var idx = closestIdx();
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    grid.addEventListener('scroll', updateDots, { passive: true });
    updateDots();

    // ── 마우스 드래그  —  놓을 때 속도 기반 관성 스냅 ──────
    var isDragging = false, startX = 0, scrollStart = 0;
    var lastX = 0, lastT = 0, velocity = 0;

    grid.addEventListener('mousedown', function (e) {
      if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
      isDragging  = true;
      startX      = e.pageX;
      scrollStart = grid.scrollLeft;
      lastX = e.pageX; lastT = Date.now(); velocity = 0;
      grid.style.cursor      = 'grabbing';
      grid.style.userSelect  = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var now = Date.now(), dt = now - lastT || 1;
      velocity = (lastX - e.pageX) / dt;   // px/ms
      lastX = e.pageX; lastT = now;
      grid.scrollLeft = scrollStart - (e.pageX - startX);
    });

    window.addEventListener('mouseup', function () {
      if (!isDragging) return;
      isDragging = false;
      grid.style.cursor     = 'grab';
      grid.style.userSelect = '';
      // 관성으로 자연스럽게 이동 후 가장 가까운 카드로 스냅
      var momentumDist = velocity * 180;   // 관성 이동 거리
      var projected    = grid.scrollLeft + momentumDist;
      // projected 기준으로 closest 카드 계산
      var center = projected + grid.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var dist = Math.abs((c.offsetLeft + c.offsetWidth / 2) - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      // 이동 거리에 비례해 duration 조정 (빠를수록 길게)
      var dist = Math.abs(targetLeft(best) - grid.scrollLeft);
      var dur  = Math.min(600, Math.max(300, dist * 0.8));
      smoothScrollTo(grid, targetLeft(best), dur);
    });

    // ── 터치: 스와이프 후 스냅 ────────────────────────────
    var touchStartX = 0, touchScrollStart = 0;
    var touchLastX = 0, touchLastT = 0, touchVel = 0;

    grid.addEventListener('touchstart', function (e) {
      if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
      touchStartX     = e.touches[0].clientX;
      touchScrollStart = grid.scrollLeft;
      touchLastX = touchStartX; touchLastT = Date.now(); touchVel = 0;
    }, { passive: true });

    grid.addEventListener('touchmove', function (e) {
      var now = Date.now(), dt = now - touchLastT || 1;
      touchVel  = (touchLastX - e.touches[0].clientX) / dt;
      touchLastX = e.touches[0].clientX; touchLastT = now;
    }, { passive: true });

    grid.addEventListener('touchend', function () {
      var momentumDist = touchVel * 180;
      var projected    = grid.scrollLeft + momentumDist;
      var center = projected + grid.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var dist = Math.abs((c.offsetLeft + c.offsetWidth / 2) - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      var dist = Math.abs(targetLeft(best) - grid.scrollLeft);
      var dur  = Math.min(550, Math.max(280, dist * 0.7));
      smoothScrollTo(grid, targetLeft(best), dur);
    }, { passive: true });
  }

  window.addEventListener('DOMContentLoaded', setup);
  window.addEventListener('resize', function () {
    var dotsWrap = document.querySelector('.benefits-dots');
    if (dotsWrap) dotsWrap.style.display = window.innerWidth > 1024 ? 'none' : '';
    setup();
  });
}());

// ================= 모바일 직무 아코디언 관련 =================
(function initJobsAccordionMobile() {

  function isMobile() {
    return window.innerWidth <= 1024;
  }
  function setupAccordion() {
    if (!isMobile()) return;
    const items = document.querySelectorAll('.job-accordion-item');
    items.forEach(item => {
      const btn = item.querySelector('.job-accordion-title');
      const panel = item.querySelector('.job-accordion-panel');
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', function() {
        const isActive = btn.classList.contains('active');
        document.querySelectorAll('.job-accordion-title.active').forEach(b => {
          b.classList.remove('active');
          if (b.nextElementSibling) b.nextElementSibling.style.maxHeight = null;
          b.blur(); // 포커스 해제 → 오렌지색 잔류 방지
        });
        if (!isActive) {
          btn.classList.add('active');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          btn.classList.remove('active');
          panel.style.maxHeight = null;
          btn.blur();
        }
      });
    });
  }
  window.addEventListener('DOMContentLoaded', setupAccordion);
  window.addEventListener('resize', () => {
    if (isMobile()) setupAccordion();
  });

})();

// ===================== 네비게이션 D-Day 계산 =====================
(function initNavDday() {

  const el = document.getElementById('navDday');
  if (!el) return;
  const deadline = new Date('2026-05-10T23:59:59+09:00');
  const now = new Date();
  const diffMs = deadline - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    el.textContent = 'D-' + diffDays;
  } else if (diffDays === 0) {
    el.textContent = 'D-Day';
    el.classList.add('dday-today');
  } else {
    el.textContent = '마감';
    el.style.opacity = '0.5';
  }

}());

// FAQ Accordion Functionality
(function initFaqAccordion() {

  function setup() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(function(btn) {
      if (btn.dataset.faqBound) return;
      btn.dataset.faqBound = 'true';
      btn.addEventListener('click', function () {
        const answer = btn.nextElementSibling;
        const isOpen = btn.classList.contains('active');
        // Close all
        questions.forEach(function(q) {
          q.classList.remove('active');
          var a = q.nextElementSibling;
          if (a) a.classList.remove('open');
        });
        // Toggle clicked
        if (!isOpen) {
          btn.classList.add('active');
          answer.classList.add('open');
        }
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

}());

/* ================================================================
  HANWHA SYSTEMS ICT 채용 사이트 - scripts.js
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

/* ================================================================
   0. LOADING PAGE
   ================================================================ */

(function initLoadingPage() {

  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  function hideLoader() {
    overlay.classList.add('hidden');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
    // Fallback: hide after 4 s even if assets stall
    setTimeout(hideLoader, 4000);
  }

}());

/* ----------------------------------------------------------------

   UTILITY
   ---------------------------------------------------------------- */

const qs = (sel, root = document) => root.querySelector(sel);

const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// Capture hash on page load (for cross-page navigation from detail pages),
// then remove it to prevent browser's native anchor jump.
if (window.location.hash) {
  const hashSection = window.location.hash.slice(1);
  if (hashSection && document.getElementById(hashSection) && !sessionStorage.getItem('pendingHomeSection')) {
    sessionStorage.setItem('pendingHomeSection', hashSection);
  }
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

/* ================================================================
   1. NAVBAR - scroll & hamburger
   ================================================================ */

(function initNavbar() {

  const navbar = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks = qs('#navLinks');
  const navLogo = qs('.nav-logo');
  let scrollAnimationFrame = null;
  const closeNavMenu = () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-label', '메뉴 열기');
  };
  const animateWindowScroll = (targetTop, minDuration = 950) => {
    // Always use animation, but use shorter duration if prefers-reduced-motion
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveMinDuration = reduceMotion ? 300 : minDuration;

    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
    }

    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    const distanceAbs = Math.abs(distance);
    const duration = Math.min(reduceMotion ? 600 : 1850, Math.max(effectiveMinDuration, 520 + distanceAbs * 0.75));
    const startTime = performance.now();
    const easeOutQuart = (progress) => 1 - Math.pow(1 - progress, 4);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      window.scrollTo({
        top: startTop + distance * easedProgress,
        behavior: 'auto'
      });

      if (progress < 1) {
        scrollAnimationFrame = requestAnimationFrame(step);
      } else {
        scrollAnimationFrame = null;
      }
    };

    scrollAnimationFrame = requestAnimationFrame(step);
  };
  const scrollToSectionWithoutHash = (sectionId, minDuration = 950) => {
    const target = qs(`#${sectionId}`);
    if (!target) return false;

    const navOffset = navbar?.offsetHeight ?? 0;
    const targetTop = window.scrollY + target.getBoundingClientRect().top - navOffset - 16;

    animateWindowScroll(Math.max(targetTop, 0), minDuration);

    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    return true;
  };
  // Scroll event - add .scrolled class (suppress while story lines are active)
  window.addEventListener('scroll', () => {
    const heroPanel = document.querySelector('.story-hero-panel');
    const heroActive = heroPanel && heroPanel.classList.contains('active');
    navbar.classList.toggle('scrolled', heroActive && window.scrollY > 40);
  }, { passive: true });
  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  });
  // In-page nav links: bind directly so the browser never gets a chance to perform hash navigation.
  qsa('#navLinks a[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const sectionId = link.dataset.section;
      if (!sectionId) return;

      e.preventDefault();
      e.stopPropagation();
      closeNavMenu();
      scrollToSectionWithoutHash(sectionId, 1050);
    }, true);
  });

  navLinks.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    closeNavMenu();
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      closeNavMenu();
    }
  });
  // Logo click -> jump to the hero slogan state inside the scroll story
  navLogo?.addEventListener('click', (e) => {
    const story = qs('#section-intro');
    if (!story) return;
    e.preventDefault();
    e.stopPropagation();
    const totalScroll = story.offsetHeight - window.innerHeight;
    const heroRevealProgress = 0.88;
    const targetTop = story.offsetTop + Math.max(totalScroll * heroRevealProgress, 0);
    animateWindowScroll(targetTop, 1250);
    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    closeNavMenu();
  }, true); // capture phase to prevent browser default

  const pendingHomeSection = sessionStorage.getItem('pendingHomeSection');
  if (pendingHomeSection) {
    sessionStorage.removeItem('pendingHomeSection');
    window.addEventListener('load', () => {
      window.requestAnimationFrame(() => {
        // section-intro: jump to hero panel reveal point (88% through scroll story)
        if (pendingHomeSection === 'section-intro') {
          const story = qs('#section-intro');
          if (story) {
            const totalScroll = story.offsetHeight - window.innerHeight;
            const targetTop = story.offsetTop + Math.max(totalScroll * 0.88, 0);
            animateWindowScroll(Math.max(targetTop, 0), 1050);
          }
        } else {
          scrollToSectionWithoutHash(pendingHomeSection, 1050);
        }
      });
    }, { once: true });
  }

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
   3. SCROLL STORY - one line at a time, then hero panel cross-fade
   ================================================================ */

(function initScrollStory() {

  const story = document.querySelector('.scroll-story');
  if (!story) return;
  const inner  = story.querySelector('.scroll-story-inner');
  const lines  = [...story.querySelectorAll('.story-line')];
  const panel  = story.querySelector('.story-hero-panel');
  const hint   = story.querySelector('.story-scroll-hint');
  const n      = lines.length;
  if (!n) return;
  // Story lines occupy 0~0.72 of scroll range; hero fades in at 0.68~0.90
  const STORY_END   = 0.74;  // progress at which all story lines are gone
  const HERO_START  = 0.68;  // progress at which hero starts fading in
  const HERO_FULL   = 0.88;  // progress at which hero is fully visible
  const FADE        = 0.14;  // fraction of a stage spent fading
  const VIGNETTE_START = 0.42;
  const VIGNETTE_END = 0.90;
  const VIGNETTE_FROM = 0.12;
  const VIGNETTE_TO_DESKTOP = 0.58;
  const VIGNETTE_TO_MOBILE = 0.40;
  const LINE_SHIFT_START = 0.50;
  const LINE_SHIFT_END = 0.78;
  const LINE_SCALE_FROM = 1;
  const LINE_SCALE_TO_DESKTOP = 0.972;
  const LINE_SCALE_TO_MOBILE = 0.985;
  const LINE_BRIGHTNESS_FROM = 1;
  const LINE_BRIGHTNESS_TO_DESKTOP = 0.90;
  const LINE_BRIGHTNESS_TO_MOBILE = 0.94;
  const GLOW_START = 0.62;
  const GLOW_END = 0.88;
  const GLOW_FROM = 0;
  const GLOW_TO_DESKTOP = 0.28;
  const GLOW_TO_MOBILE = 0.18;
  const HINT_FADE_START = 0.56;
  const HINT_FADE_END = 0.72;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const norm = (p, start, end) => clamp01((p - start) / (end - start));
  const stageSize = STORY_END / n;
  let heroReached = false;

  function onManualInput(e) {
    // 기존 자동 넘김 관련 코드 제거됨
  }
  function storyLineOpacity(progress, i) {
    const fadeW     = stageSize * FADE;
    const inAt      = i * stageSize;
    const fullAt    = inAt + fadeW;
    const outAt     = (i + 1) * stageSize - fadeW;
    const goneAt    = (i + 1) * stageSize;
    if (i === 0 && progress <= fullAt) return 1;
    // last story line fades out toward STORY_END
    if (i === n - 1) {
      if (progress >= fullAt && progress <= outAt)  return 1;
      if (progress > outAt && progress < STORY_END) return 1 - (progress - outAt) / (STORY_END - outAt);
      if (progress >= STORY_END)                    return 0;
    }
    if (progress < inAt)   return 0;
    if (progress < fullAt) return (progress - inAt) / fadeW;
    if (progress < outAt)  return 1;
    if (progress < goneAt) return 1 - (progress - outAt) / fadeW;
    return 0;
  }
  function update() {
    const rect        = story.getBoundingClientRect();
    const totalScroll = story.offsetHeight - window.innerHeight;
    if (totalScroll <= 0) return;
    const progress = Math.min(1, Math.max(0, -rect.top / totalScroll));
    const isMobile = window.innerWidth <= 1024;
    const tVignette = norm(progress, VIGNETTE_START, VIGNETTE_END);
    const tLineShift = norm(progress, LINE_SHIFT_START, LINE_SHIFT_END);
    const tGlow = norm(progress, GLOW_START, GLOW_END);
    const vignetteTo = isMobile ? VIGNETTE_TO_MOBILE : VIGNETTE_TO_DESKTOP;
    const lineScaleTo = isMobile ? LINE_SCALE_TO_MOBILE : LINE_SCALE_TO_DESKTOP;
    const lineBrightnessTo = isMobile ? LINE_BRIGHTNESS_TO_MOBILE : LINE_BRIGHTNESS_TO_DESKTOP;
    const glowTo = isMobile ? GLOW_TO_MOBILE : GLOW_TO_DESKTOP;
    const vignetteOpacity = mix(VIGNETTE_FROM, vignetteTo, tVignette);
    const lineScale = mix(LINE_SCALE_FROM, lineScaleTo, tLineShift);
    const lineBrightness = mix(LINE_BRIGHTNESS_FROM, lineBrightnessTo, tLineShift);
    const glowOpacity = mix(GLOW_FROM, glowTo, tGlow);
    if (inner) {
      inner.style.setProperty('--story-vignette-opacity', vignetteOpacity.toFixed(4));
      inner.style.setProperty('--story-end-glow-opacity', glowOpacity.toFixed(4));
    }
    const dominantStage = Math.min(n - 1, Math.floor((progress / STORY_END) * n));
    // Update story lines
    heroReached = progress >= HERO_START;
    lines.forEach((line, i) => {
      const op  = storyLineOpacity(progress, i);
      line.style.opacity = op;
      line.style.display = heroReached ? 'none' : '';
      const dir = i < dominantStage ? -1 : i > dominantStage ? 1 : 0;
      const y = op < 0.99 ? dir * (1 - op) * 40 : 0;
      line.style.transform = `translateY(${y}px) scale(${lineScale.toFixed(4)})`;
      // 모바일에서는 blur 생략 (성능)
      if (isMobile) {
        line.style.filter = `brightness(${lineBrightness.toFixed(4)})`;
      } else {
        const blur = (1 - op) * 3;
        line.style.filter = `brightness(${lineBrightness.toFixed(4)}) blur(${blur.toFixed(2)}px)`;
      }
      line.classList.toggle('lit', op > 0.5);
    });
    // Story hint stays visible in line phase and fades out before hero fully appears.
    if (hint) {
      const hintT = norm(progress, HINT_FADE_START, HINT_FADE_END);
      const hintOp = 1 - hintT;
      hint.style.opacity = String(hintOp);
      // opacity=0이어도 z-index 4로 hero-scroll-hint 터치를 가로채므로
      // 투명해지면 pointer-events를 끄고, 보일 때만 활성화
      hint.style.pointerEvents = hintOp < 0.05 ? 'none' : '';
    }
    // Fade in hero panel
    if (panel) {
      const heroOp = progress < HERO_START ? 0
        : progress > HERO_FULL ? 1
        : (progress - HERO_START) / (HERO_FULL - HERO_START);
      panel.style.opacity = heroOp;
      if (heroOp >= 0.25 && !panel.classList.contains('active')) {
        panel.classList.add('active');
        // Allow navbar to show once hero is revealed
        document.querySelector('#navbar')?.classList.toggle('scrolled', window.scrollY > 40);
      }
    }
  }
  let _snapTimer = null;
  let _snapping  = false;

  function snapHero() {
    if (!panel) return;
    const currentOp = parseFloat(panel.style.opacity);
    if (isNaN(currentOp) || currentOp <= 0 || currentOp >= 1) return;
    _snapping = true;
    const snapTo = currentOp >= 0.5 ? 1 : 0;
    panel.style.transition = 'opacity 0.25s ease';
    panel.style.opacity = String(snapTo);
    if (snapTo === 1) {
      panel.classList.add('active');
      lines.forEach(function (line) { line.style.display = 'none'; });
    }
    setTimeout(function () {
      panel.style.transition = '';
      _snapping = false;
    }, 300);
  }

  window.addEventListener('scroll', function () {
    if (_snapping) {
      if (panel) panel.style.transition = '';
      _snapping = false;
    }
    clearTimeout(_snapTimer);
    update();
    _snapTimer = setTimeout(snapHero, 150);
  }, { passive: true });

  // ── 히어로 스크롤 힌트 → section-jobs 로 스크롤 ────────────
  var heroHint = story.querySelector('.hero-scroll-hint');
  if (heroHint) {
    function scrollToJobs() {
      var target = document.getElementById('section-jobs');
      if (!target) return;
      var navbar = document.getElementById('navbar');
      var navH = navbar ? navbar.offsetHeight : 0;
      var top = window.scrollY + target.getBoundingClientRect().top - navH - 16;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }
    heroHint.addEventListener('click', scrollToJobs);
    // 터치 탭 판별 (스크롤과 구분)
    var heroHintTouchY = 0;
    heroHint.addEventListener('touchstart', function (e) {
      heroHintTouchY = e.touches[0].clientY;
    }, { passive: true });
    heroHint.addEventListener('touchend', function (e) {
      if (Math.abs(heroHintTouchY - e.changedTouches[0].clientY) > 20) return;
      scrollToJobs();
      e.stopPropagation();
    }, { passive: true });
    heroHint.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToJobs(); }
    });
  }

  update();

}());

/* ================================================================
   3-C. SCROLL STORY STEP SNAP
   - wheel/touch 한 번 = 정확히 다음(이전) 스텝으로만 이동
   ================================================================ */
(function initScrollStorySnap() {
  'use strict';
  var story = document.querySelector('.scroll-story');
  if (!story) return;
  var n = story.querySelectorAll('.story-line').length;
  if (!n) return;

  // initScrollStory 와 동일한 상수
  var STORY_END = 0.74;
  var HERO_FULL = 0.88;
  var stageSize = STORY_END / n;

  // 각 스텝의 progress 기준점: 라인 1..n-1 + 히어로
  // (라인 0은 p=0 초기 상태에서 이미 표시되므로 별도 스냅 불필요)
  var STEPS = [];
  for (var s = 1; s < n; s++) STEPS.push((s + 0.5) * stageSize);
  STEPS.push(HERO_FULL);

  var isSnapping = false;
  var _rafId = null;
  var touchY0 = 0;

  // ease-out-quart: 빠르게 시작해서 부드럽게 감속
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function totalScroll() {
    return story.offsetHeight - window.innerHeight;
  }

  function rawProgress() {
    var t = totalScroll();
    if (t <= 0) return -1;
    return -story.getBoundingClientRect().top / t;
  }

  function snapToStep(idx) {
    var t = totalScroll();
    var rect = story.getBoundingClientRect();
    var docTop = rect.top + window.scrollY;
    var targetY;
    if (idx < 0)                  targetY = docTop - 1;
    else if (idx >= STEPS.length) targetY = docTop + t + 1;
    else                          targetY = docTop + STEPS[idx] * t;

    targetY = Math.round(targetY);
    var startY = window.scrollY;
    var dist   = targetY - startY;
    if (Math.abs(dist) < 2) return;

    var DURATION = 520; // ms — 자연스러운 감속
    var startTime = null;

    if (_rafId) cancelAnimationFrame(_rafId);
    isSnapping = true;

    function step(now) {
      if (!startTime) startTime = now;
      var elapsed = now - startTime;
      var frac = Math.min(elapsed / DURATION, 1);
      var easedY = startY + dist * easeOutQuart(frac);
      window.scrollTo(0, easedY);
      if (frac < 1) {
        _rafId = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        isSnapping = false;
        _rafId = null;
      }
    }
    _rafId = requestAnimationFrame(step);
  }

  function nextStepIdx(dir, p) {
    if (dir > 0) {
      for (var i = 0; i < STEPS.length; i++) {
        if (STEPS[i] > p + 0.015) return i;
      }
      return STEPS.length; // story 탈출 (아래)
    } else {
      for (var j = STEPS.length - 1; j >= 0; j--) {
        if (STEPS[j] < p - 0.015) return j;
      }
      return -1; // story 탈출 (위)
    }
  }

  // ── Wheel: 스텝 단위 스냅 ──────────────────────────────────
  window.addEventListener('wheel', function (e) {
    if (!e.deltaY) return;
    var p = rawProgress();
    var dir = e.deltaY > 0 ? 1 : -1;

    // story 범위 완전 벗어난 경우 → 네이티브 스크롤
    if (p < 0 || p > 1) return;
    // story 경계에서 탈출 방향이면 네이티브에게 양보
    if (p <= 0.005 && dir < 0) return;
    if (p >= 0.995 && dir > 0) return;

    e.preventDefault();
    // 진행 중인 스냅이 절반 이상 지났을 때만 다음 입력 수락
    if (isSnapping) {
      if (_rafId) cancelAnimationFrame(_rafId);
      isSnapping = false;
    }
    snapToStep(nextStepIdx(dir, p));
  }, { passive: false });

  // ── Touch: 스와이프 방향으로 한 스텝 ─────────────────────
  // p=0 버그 수정: story 범위 진입 시(p>=0)에도 touchY0 저장
  var touchInStory = false;
  window.addEventListener('touchstart', function (e) {
    var p0 = rawProgress();
    touchInStory = p0 >= 0 && p0 <= 1;
    if (touchInStory) {
      touchY0 = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    var p = rawProgress();
    if (!touchInStory) return;
    // p < 0 또는 p > 1: story 완전히 벗어난 경우만 무시 (p=0/1 경계 포함)
    if (p < 0 || p > 1) return;
    if (isSnapping) return;
    var dy = touchY0 - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 40) return; // 너무 짧은 스와이프 무시
    var dir = dy > 0 ? 1 : -1;
    if (p <= 0.005 && dir < 0) return;
    if (p >= 0.995 && dir > 0) return;
    snapToStep(nextStepIdx(dir, p));
  }, { passive: true });

  // ── 스크롤 힌트 클릭/탭 → 다음 스텝 스냅 ───────────────
  var hint = story.querySelector('.story-scroll-hint');
  if (hint) {
    // 클릭
    hint.addEventListener('click', function () {
      var p = rawProgress();
      if (p < 0 || p > 1) return;
      if (isSnapping) { if (_rafId) cancelAnimationFrame(_rafId); isSnapping = false; }
      snapToStep(nextStepIdx(1, p));
    });
    // 터치 탭 (스와이프와 구분하기 위해 이동량이 작을 때만)
    var hintTouchY = 0;
    hint.addEventListener('touchstart', function (e) {
      hintTouchY = e.touches[0].clientY;
    }, { passive: true });
    hint.addEventListener('touchend', function (e) {
      var dy = Math.abs(hintTouchY - e.changedTouches[0].clientY);
      if (dy > 20) return; // 탭이 아닌 스와이프 → 무시
      var p = rawProgress();
      if (p < 0 || p > 1) return;
      if (isSnapping) { if (_rafId) cancelAnimationFrame(_rafId); isSnapping = false; }
      snapToStep(nextStepIdx(1, p));
      e.stopPropagation(); // 상위 window touchend 중복 방지
    }, { passive: true });
    // 키보드(Enter/Space) 지원
    hint.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var p = rawProgress();
        if (isSnapping) { if (_rafId) cancelAnimationFrame(_rafId); isSnapping = false; }
        snapToStep(nextStepIdx(1, p));
      }
    });
  }

}());

/* ================================================================
   4. HERO CANVAS - 3D rotating cubes (WebGL-lite via Canvas 2D)
   ================================================================ */


/* ================================================================
   3-B. GLOBAL BG CANVAS - same 3D cubes behind all dark sections
   ================================================================ */

(function initBgCanvas() {

  const canvas = qs('#bgCubeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const resize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });
  // --- Cube wireframe geometry (unit cube) ---
  const VERTS = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
  ];
  const EDGES = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];
  function project(v, fov, cx, cy) {
    const z = v[2] + fov;
    const scale = fov / (z || 1);
    return [v[0] * scale + cx, v[1] * scale + cy];
  }
  function rotX(v, a) {
    return [v[0], v[1]*Math.cos(a)-v[2]*Math.sin(a), v[1]*Math.sin(a)+v[2]*Math.cos(a)];
  }
  function rotY(v, a) {
    return [v[0]*Math.cos(a)+v[2]*Math.sin(a), v[1], -v[0]*Math.sin(a)+v[2]*Math.cos(a)];
  }
  function rotZ(v, a) {
    return [v[0]*Math.cos(a)-v[1]*Math.sin(a), v[0]*Math.sin(a)+v[1]*Math.cos(a), v[2]];
  }
  function makeSeededRand(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // --- Hero/Story 진행률 기반 큐브 등장 통합 (스토리라인 개수 기반) ---
  function getStoryLineCount() {
    const story = document.querySelector('.scroll-story');
    if (!story) return 0;
    return story.querySelectorAll('.story-line').length;
  }
  const getCubeConfig = () => {
    const vw = window.innerWidth;
    if (vw <= 480) return { count: 4, sizeScale: 0.55 };
    if (vw <= 768) return { count: 6, sizeScale: 0.7 };
    if (vw <= 1024) return { count: 8, sizeScale: 0.85 };
    return { count: 10, sizeScale: 1 };
  };
  let cubes = [];
  let storyLineCount = getStoryLineCount();
  const buildCubes = () => {
    const { count, sizeScale } = getCubeConfig();
    const rand = makeSeededRand(19930505); // 고정 seed로 위치 고정
    cubes = Array.from({ length: count }, () => ({
      x: rand() * 1.8 - 0.9,
      y: rand() * 1.8 - 0.9,
      z: rand() * 3 + 1.5,
      size: (40 + rand() * 80) * sizeScale,
      ax: rand() * 0.006 + 0.002,
      ay: rand() * 0.007 + 0.002,
      az: rand() * 0.004,
      rx: rand() * Math.PI * 2,
      ry: rand() * Math.PI * 2,
      rz: rand() * Math.PI * 2,
      vy: (rand() - 0.5) * 0.0005,
      vx: (rand() - 0.5) * 0.0003,
      alpha: 0.12 + rand() * 0.18,
      colorH: rand() > 0.5 ? 24 : 200,
    }));
    storyLineCount = getStoryLineCount();
  };
  buildCubes();
  window.addEventListener('resize', () => {
    buildCubes();
  }, { passive: true });
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.2;
  }, { passive: true });
  // 스토리 진행률 계산
  let storyProgress = 0;
  function getStoryProgress() {
    const story = document.querySelector('.scroll-story');
    if (!story) return 1;
    const rect = story.getBoundingClientRect();
    const totalScroll = story.offsetHeight - window.innerHeight;
    if (totalScroll <= 0) return 1;
    return Math.min(1, Math.max(0, -rect.top / totalScroll));
  }
  window.addEventListener('scroll', () => {
    storyProgress = getStoryProgress();
  }, { passive: true });
  storyProgress = getStoryProgress();
  function drawCube(cube, t, fadeIn = 1) {
    cube.rx += cube.ax;
    cube.ry += cube.ay + mouseX * 0.002;
    cube.rz += cube.az;
    cube.x += cube.vx;
    cube.y += cube.vy;
    if (cube.x > 1.1 || cube.x < -1.1) cube.vx *= -1;
    if (cube.y > 1.1 || cube.y < -1.1) cube.vy *= -1;
    const cx = (cube.x * 0.5 + 0.5) * W;
    const cy = (cube.y * 0.5 + 0.5) * H;
    const fov = 300;
    const transformed = VERTS.map((v) => {
      let p = [v[0]*cube.size, v[1]*cube.size, v[2]*cube.size];
      p = rotX(p, cube.rx);
      p = rotY(p, cube.ry);
      p = rotZ(p, cube.rz);
      return p;
    });
    const projected = transformed.map((v) => project(v, fov, cx, cy));
    const isOrange = cube.colorH === 24;
    const alpha = (cube.alpha || 0.15) * fadeIn;
    const isMobileCanvas = window.innerWidth <= 768;
    ctx.strokeStyle = isOrange
      ? `rgba(255, 107, 0, ${alpha})`
      : `rgba(100, 140, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 1.2;
    // 모바일에서 shadowBlur 생략 (성능 최대 원인)
    if (!isMobileCanvas) {
      ctx.shadowBlur = isOrange ? 12 : 6;
      ctx.shadowColor = isOrange ? 'rgba(255,107,0,0.4)' : 'rgba(80,120,255,0.3)';
    } else {
      ctx.shadowBlur = 0;
    }
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
    // 등장 큐브 개수: 스토리라인 개수에 맞춰 한 줄씩 추가, 처음엔 0개
    let showCount = 0;
    // 스토리 진행률 계산 (0~STORY_END까지 storyLineCount개로 나눔)
    const STORY_END = 0.74;
    if (storyLineCount > 0) {
      for (let i = 0; i < storyLineCount; ++i) {
        const appearT = (i + 0.5) * (STORY_END / storyLineCount); // 각 라인 중앙쯤에 등장
        if (storyProgress >= appearT) showCount = i + 1;
      }
    }
    // 히어로 등장 이후에는 전체 큐브
    if (storyProgress >= STORY_END) showCount = cubes.length;
    for (let i = 0; i < showCount; ++i) {
      let fade = 1;
      // 각 큐브가 등장할 때 페이드인 효과
      if (storyLineCount > 0 && i < storyLineCount) {
        const appearT = (i + 0.5) * (STORY_END / storyLineCount);
        if (storyProgress < appearT + 0.08 && storyProgress >= appearT) {
          fade = (storyProgress - appearT) / 0.08;
          fade = Math.max(0, Math.min(1, fade));
        } else if (storyProgress < appearT) {
          fade = 0;
        }
      }
      drawCube(cubes[i], t, fade);
    }
    raf = requestAnimationFrame(animate);
  }
  window.addEventListener('resize', () => {
    buildCubes();
  }, { passive: true });

  // 캔버스가 뷰포트에 보일 때만 애니메이션 실행 (배터리/CPU 절약)
  const canvasObserver = new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !raf) {
      raf = requestAnimationFrame(animate);
    } else if (!visible && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }, { threshold: 0 });
  canvasObserver.observe(canvas);

  canvas.style.opacity = '1';
  raf = requestAnimationFrame(animate);

})();

/* ================================================================
   4. FLOATING CUBES - decorative div-based cubes injected into sections
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
   4-B. PROCESS FLOW - sequential reveal on scroll
   ================================================================ */

(function initProcessFlowReveal() {

  const flow = qs('.process-flow');
  if (!flow) return;
  const items = [...flow.querySelectorAll('.pf-step, .pf-arrow')];
  if (!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add('pf-visible'), i * 120);
    });
    obs.disconnect();
  }, { threshold: 0.15 });
  obs.observe(flow);

})();

/* ================================================================
   5. PARALLAX TEXT EFFECTS (subtle tilt on section titles)
   ================================================================ */

(function initParallaxText() {

  const titles = qsa('.section-title');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    titles.forEach((el) => {
      if (el.classList.contains('visible')) return; // 이미 나타난 타이틀은 고정
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const fromCenter = (window.innerHeight / 2 - center) / window.innerHeight;
      el.style.transform = `translateY(${fromCenter * 18}px)`;
    });
  }, { passive: true });

})();

/* ================================================================
   6. HERO TITLE - mouse tilt 3D effect
   ================================================================ */

(function initHeroTilt() {

  // 터치 기기(모바일/태블릿)에서는 mousemove가 발생하지 않으므로 리스너 등록 자체를 생략
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
   10. COUNTDOWN TIMER (target: 2026-05-10 23:59:59 KST)
   ================================================================ */

(function initCountdown() {

  const target = new Date('2026-05-10T23:59:59+09:00').getTime();
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
  let _cdInterval = setInterval(tick, 1000);
  // 탭이 백그라운드로 가면 타이머 중단, 복귀 시 재개
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(_cdInterval);
    } else {
      tick();
      _cdInterval = setInterval(tick, 1000);
    }
  });

})();

/* ================================================================
   11. SECTION BG PARALLAX (subtle Y-shift on scroll)
   ================================================================ */

(function initSectionParallax() {

  // 모바일에서는 시각적 효과가 미미하고 스크롤마다 DOM 조작 비용이 있으므로 스킵
  if (window.innerWidth <= 768) return;

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
   13. MOBILE TABLE - inject data-label attributes
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
  const navAs = qsa('.nav-links a[data-section]');
  if (!sections.length || !navAs.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAs.forEach((a) => a.classList.remove('active-nav'));
        const active = navAs.find((a) => a.dataset.section === entry.target.id);
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

// Ensure all main sections are visible
(function ensureSectionsVisible() {

  const sections = ['section-jobs', 'section-process', 'section-ict-story'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.style.display = 'block';
    }
  });

})();

/* ================================================================
   15. JD 모달 (직무별 상세 모달)
   ================================================================ */

(function initJdModals() {
  'use strict';

  var allJdModals = document.querySelectorAll('.modal-jd');
  if (!allJdModals.length) return;

  function openJdModal(modalId) {
    closeAllJdModals();
    var modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.querySelector('.modal-box').scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeAllJdModals() {
    allJdModals.forEach(function(m) { m.classList.remove('open'); });
    document.body.style.overflow = '';
  }

  // 모달 트리거 버튼 클릭 / 터치
  document.addEventListener('click', function(e) {
    // 닫기 버튼 (데스크탑 click)
    var closeBtn = e.target.closest('.modal-close');
    if (closeBtn && closeBtn.closest('.modal-jd')) {
      closeAllJdModals();
      return;
    }
    // 트리거 버튼
    var btn = e.target.closest('[data-jd-modal]');
    if (btn) {
      e.preventDefault();
      openJdModal(btn.getAttribute('data-jd-modal'));
      return;
    }
    // 오버레이 클릭으로 닫기
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('modal-jd')) {
      closeAllJdModals();
    }
  });

  // 닫기 버튼 (touchend 우선 처리 – 모바일 ghost click 방지)
  document.addEventListener('touchend', function(e) {
    var closeBtn = e.target.closest('.modal-close');
    if (closeBtn && closeBtn.closest('.modal-jd')) {
      e.preventDefault();
      e.stopImmediatePropagation(); // interview-modal.js의 touchend가 동시에 실행되지 않도록
      closeAllJdModals();
    }
  }, { passive: false });

  // ESC 키로 닫기
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllJdModals();
  });

  // 모달 내 지원하기 버튼 → section-cta로 스크롤 후 모달 닫기
  document.addEventListener('click', function(e) {
    var applyBtn = e.target.closest('.modal-jd-actions .btn-apply');
    if (!applyBtn) return;
    closeAllJdModals();
    var target = document.getElementById('section-cta');
    if (!target) return;
    var navbar = document.getElementById('navbar');
    var navH = navbar ? navbar.offsetHeight : 0;
    var top = window.scrollY + target.getBoundingClientRect().top - navH - 16;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    e.preventDefault();
  });

}());

/* ============================================================
   인터뷰 모달 내 한화 계열사명 → HanwhaL 폰트 자동 적용
   ============================================================ */
(function initHanwhaCiInModals() {
  // 더 긴 이름을 먼저 매칭해야 부분치환 방지
  var names = [
    '한화시스템 ICT부문',
    '한화오션에코텍',
    '한화오션 에코텍',
    '한화에어로스페이스',
    '한화솔루션',
    '한화오션',
    '한화시스템',
    '한화그룹',
    '아워홈'
  ];
  var pattern = names.map(function(n) {
    return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|');
  var regex = new RegExp('(' + pattern + ')', 'g');

  function wrapTextNode(node) {
    var text = node.nodeValue;
    regex.lastIndex = 0;
    if (!regex.test(text)) return;
    regex.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      var span = document.createElement('span');
      span.className = 'hanwha-ci';
      span.textContent = m[0];
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    node.parentNode.replaceChild(frag, node);
  }

  function walkNode(node) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      wrapTextNode(node);
    } else if (node.nodeType === 1 /* ELEMENT_NODE */ &&
               node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
      // childNodes를 배열로 복사 후 순회 (DOM 변이로 인한 오류 방지)
      Array.prototype.slice.call(node.childNodes).forEach(walkNode);
    }
  }

  // 인터뷰 모달(.modal-overlay, JD 모달 제외)의 본문만 처리
  document.querySelectorAll('.modal-overlay:not(.modal-jd) .modal-content').forEach(function(content) {
    walkNode(content);
  });
}());

/* ============================================================
   GA4 이벤트 트래킹
   - job_detail_view : 직무 상세보기 버튼 클릭
   - apply_click     : 지원하기 버튼 위치별 클릭
============================================================ */
(function initGA4Tracking() {
  'use strict';

  function sendEvent(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
  }

  // ── 1. 직무 상세보기 클릭 ──────────────────────────────────
  var JOB_NAMES = {
    'modal-jd-ai-agent':          'AI Agent 전문가',
    'modal-jd-vlm':               'VLM 전문가',
    'modal-jd-math-optimization': '수학적 최적화 전문가',
    'modal-jd-ontology':          'Ontology 전문가',
    'modal-jd-physical-ai':       'Physical AI 엔지니어',
    'modal-jd-ax':                'AX 전략기획'
  };

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-jd-modal]');
    if (btn) {
      var modalId = btn.getAttribute('data-jd-modal');
      sendEvent('job_detail_view', {
        job_title: JOB_NAMES[modalId] || modalId
      });
    }
  });

  // ── 2. 지원하기 버튼 위치별 클릭 ──────────────────────────
  var APPLY_BUTTONS = [
    { selector: '.btn-apply-nav',               location: '네비게이션' },
    { selector: '.btn-hero',                    location: '히어로 섹션' },
    { selector: '.modal-jd-actions .btn-apply', location: 'JD 모달 내' },
    { selector: '.btn-apply-big',               location: '하단 CTA' }
  ];

  APPLY_BUTTONS.forEach(function(item) {
    document.querySelectorAll(item.selector).forEach(function(btn) {
      btn.addEventListener('click', function() {
        var jobTitle = null;
        var parentModal = btn.closest('.modal-overlay.modal-jd');
        if (parentModal) {
          var titleEl = parentModal.querySelector('.modal-jd-title');
          jobTitle = titleEl ? titleEl.textContent.trim() : null;
        }
        sendEvent('apply_click', {
          button_location: item.location,
          job_title: jobTitle
        });
      });
    });
  });

}());
